import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { detectMimeFromMagicBytes, isMimeAllowed } from '@/lib/file-signature';
import { requireAdmin } from '@/lib/require-admin';
import { createAbortToken, verifyAbortToken, assertAbortSecretConfigured } from '@/lib/storage-abort-token';
import {
  extensionFromDetectedMime,
  getStorageCategory,
  isSafeStorageObjectPath,
  STORAGE_CATEGORY_MAP,
} from '@/lib/storage-categories';
import { API_UPLOAD_PAYLOAD_MAX_BYTES } from '@/lib/storage-config';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { assertUploadRateLimit, getClientIp } from '@/lib/storage-rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PAYLOAD_TOO_LARGE_MESSAGE =
  'O arquivo processado excede o limite de envio do servidor. Se for uma imagem, tente compactá-la mais ou usar outro formato. Se for um documento, envie um arquivo menor.';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPayloadTooLarge(contentLengthHeader: string | null, fileSize?: number): boolean {
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > API_UPLOAD_PAYLOAD_MAX_BYTES) {
      return true;
    }
  }
  return typeof fileSize === 'number' && fileSize > API_UPLOAD_PAYLOAD_MAX_BYTES;
}

export async function POST(req: NextRequest) {
  try {
    const rate = assertUploadRateLimit(getClientIp(req));
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Muitos envios em pouco tempo. Aguarde um momento e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
      );
    }

    if (isPayloadTooLarge(req.headers.get('content-length'))) {
      return jsonError(PAYLOAD_TOO_LARGE_MESSAGE, 413);
    }

    const formData = await req.formData();
    const category = getStorageCategory(formData.get('category'));
    const file = formData.get('file');

    if (!category) {
      return jsonError('Categoria de arquivo inválida.', 400);
    }
    if (!(file instanceof File)) {
      return jsonError('Arquivo obrigatório.', 400);
    }
    if (file.size <= 0) {
      return jsonError('O arquivo enviado está vazio.', 400);
    }
    if (isPayloadTooLarge(null, file.size) || file.size > category.maxPayloadBytes) {
      return jsonError(PAYLOAD_TOO_LARGE_MESSAGE, 413);
    }

    if (category.adminOnly) {
      const auth = await requireAdmin(req);
      if (!auth.ok) return auth.response;
    }

    try {
      assertAbortSecretConfigured();
    } catch {
      console.error('STORAGE_ABORT_SECRET is not configured.');
      return jsonError('Configuração de armazenamento incompleta no servidor.', 500);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.byteLength > category.maxPayloadBytes || bytes.byteLength > API_UPLOAD_PAYLOAD_MAX_BYTES) {
      return jsonError(PAYLOAD_TOO_LARGE_MESSAGE, 413);
    }

    const detectedMime = detectMimeFromMagicBytes(bytes);
    if (!detectedMime || !isMimeAllowed(detectedMime, category.allowedMimeTypes)) {
      return jsonError('Tipo de arquivo não permitido.', 400);
    }

    const path = `${category.folder}/${randomUUID()}.${extensionFromDetectedMime(detectedMime)}`;
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from(category.bucket).upload(path, bytes, {
      cacheControl: '3600',
      upsert: false,
      contentType: detectedMime,
    });

    if (error) {
      console.error('Storage upload failed:', error.message);
      return jsonError('Não foi possível enviar o arquivo. Tente novamente em instantes.', 500);
    }

    let publicUrl: string | undefined;
    if (category.visibility === 'public') {
      publicUrl = supabaseAdmin.storage.from(category.bucket).getPublicUrl(path).data.publicUrl;
    }

    let deleteToken: string | undefined;
    try {
      deleteToken = createAbortToken(category.bucket, path);
    } catch (tokenError) {
      console.error('Abort token unavailable:', tokenError);
    }

    return NextResponse.json({
      bucket: category.bucket,
      path,
      publicUrl: publicUrl || null,
      deleteToken: deleteToken || null,
    });
  } catch (error) {
    console.error('Storage upload route error:', error);
    return jsonError('Não foi possível enviar o arquivo. Tente novamente em instantes.', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { deleteToken?: unknown };
    const token = typeof body.deleteToken === 'string' ? body.deleteToken : '';
    const parsed = verifyAbortToken(token);
    if (!parsed) {
      return jsonError('Não foi possível cancelar o envio deste arquivo.', 400);
    }

    const categoryFolder = parsed.path.split('/').slice(0, -1).join('/');
    const matchingCategory = Object.values(STORAGE_CATEGORY_MAP).find(
      (item) => item.bucket === parsed.bucket && item.folder === categoryFolder
    );

    if (!matchingCategory || !isSafeStorageObjectPath(parsed.path, matchingCategory.folder)) {
      return jsonError('Não foi possível cancelar o envio deste arquivo.', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from(parsed.bucket).remove([parsed.path]);
    if (error) {
      console.error('Storage abort remove failed:', error.message);
      return jsonError('Não foi possível cancelar o envio deste arquivo.', 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Storage abort route error:', error);
    return jsonError('Não foi possível cancelar o envio deste arquivo.', 500);
  }
}
