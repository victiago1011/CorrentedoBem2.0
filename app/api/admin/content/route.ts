import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { removeValidatedStorageObjects } from '@/lib/storage-cleanup';
import {
  ADMIN_CONTENT_TYPES,
  extractStorageObjectsFromField,
  extractStorageObjectsFromRow,
  isAdminContentType,
  resolveStoredStorageObject,
} from '@/lib/storage-object-ref';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseRecordId(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 80) return null;
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
    return trimmed;
  }
  return null;
}

function readOptionalString(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  if (value.length > max) return null;
  return value;
}

function readRequiredString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => null)) as { type?: unknown; id?: unknown } | null;
    if (!body || !isAdminContentType(body.type)) {
      return jsonError('Tipo de registro inválido.', 400);
    }

    const id = parseRecordId(body.id);
    if (id === null) {
      return jsonError('Identificador inválido.', 400);
    }

    const config = ADMIN_CONTENT_TYPES[body.type];
    const selectColumns = ['id', ...config.media.map((field) => field.column)].join(', ');
    const admin = getSupabaseAdmin();

    const { data: row, error: selectError } = await admin
      .from(config.table)
      .select(selectColumns)
      .eq('id', id)
      .maybeSingle();

    if (selectError) {
      console.error('Admin content select failed', { type: body.type, message: selectError.message });
      return jsonError('Não foi possível excluir o registro.', 500);
    }
    if (!row) {
      return jsonError('Registro não encontrado.', 404);
    }

    const objects = extractStorageObjectsFromRow(
      body.type,
      row as unknown as Record<string, unknown>
    );

    const { data: deleted, error: deleteError } = await admin
      .from(config.table)
      .delete()
      .eq('id', id)
      .select('id');

    if (deleteError || !deleted || deleted.length === 0) {
      console.error('Admin content delete failed', { type: body.type, message: deleteError?.message });
      return jsonError('Não foi possível excluir o registro.', 500);
    }

    const cleanup = await removeValidatedStorageObjects(objects);
    if (cleanup === 'partial') {
      console.error('Admin content storage cleanup partial', { type: body.type, id });
    }

    return NextResponse.json({ deleted: true, cleanup });
  } catch (error) {
    console.error('Admin content delete route error:', error);
    return jsonError('Não foi possível excluir o registro.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || body.type !== 'noticia') {
      return jsonError('Tipo de registro inválido.', 400);
    }

    const id = parseRecordId(body.id);
    if (id === null) {
      return jsonError('Identificador inválido.', 400);
    }

    const title = readRequiredString(body.title, 500);
    const content = readOptionalString(body.content, 500000);
    const excerpt = readOptionalString(body.excerpt, 4000);
    const author = readOptionalString(body.author, 200);
    const category = readOptionalString(body.category, 200);
    const imageUrl = readRequiredString(body.image_url, 2000);

    if (!title || content === null || excerpt === null || author === null || category === null || !imageUrl) {
      return jsonError('Dados da notícia inválidos.', 400);
    }

    const newImageRef = resolveStoredStorageObject(imageUrl, 'news-image');
    if (!newImageRef) {
      return jsonError('A nova imagem não pertence ao armazenamento permitido.', 400);
    }

    const admin = getSupabaseAdmin();
    const { data: current, error: selectError } = await admin
      .from('noticias')
      .select('id, image_url')
      .eq('id', id)
      .maybeSingle();

    if (selectError) {
      console.error('Admin noticia select failed', { message: selectError.message });
      return jsonError('Não foi possível atualizar a notícia.', 500);
    }
    if (!current) {
      return jsonError('Registro não encontrado.', 404);
    }

    const previousObjects = extractStorageObjectsFromField(
      typeof current.image_url === 'string' ? current.image_url : null,
      'news-image'
    );

    const { data: updated, error: updateError } = await admin
      .from('noticias')
      .update({
        title,
        content,
        excerpt,
        image_url: imageUrl,
        author,
        category,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Admin noticia update failed', { message: updateError?.message });
      return jsonError('Não foi possível atualizar a notícia.', 500);
    }

    const staleObjects = previousObjects.filter(
      (object) => object.bucket !== newImageRef.bucket || object.path !== newImageRef.path
    );
    const cleanup = await removeValidatedStorageObjects(staleObjects);
    if (cleanup === 'partial') {
      console.error('Admin noticia image cleanup partial', { id });
    }

    return NextResponse.json({ updated: true, cleanup, record: updated });
  } catch (error) {
    console.error('Admin content patch route error:', error);
    return jsonError('Não foi possível atualizar a notícia.', 500);
  }
}
