import { NextRequest, NextResponse } from 'next/server';
import { isWithinPublicWindow } from '@/lib/legal';
import { parseAttachments, isStoragePath } from '@/lib/media-src';
import { requireAdmin } from '@/lib/require-admin';
import { isSafeStorageObjectPath, STORAGE_CATEGORY_MAP } from '@/lib/storage-categories';
import { SIGNED_URL_EXPIRES_IN_SECONDS, type SignedFileKind } from '@/lib/storage-config';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

type SignedRow = {
  id: string | number;
  status?: string | null;
  expires_at?: string | null;
  storedValue?: string | null;
};

type SignedKindConfig = {
  kind: SignedFileKind;
  categoryId: 'talent-cv' | 'job-attachment' | 'business-attachment';
  publicStatus: string;
  checkExpiry: boolean;
  load: (
    admin: ReturnType<typeof getSupabaseAdmin>,
    recordId: string | number
  ) => Promise<{ data: SignedRow | null; error: { message: string } | null }>;
};

const KIND_MAP: Record<SignedFileKind, SignedKindConfig> = {
  'talent-cv': {
    kind: 'talent-cv',
    categoryId: 'talent-cv',
    publicStatus: 'active',
    checkExpiry: true,
    load: async (admin, recordId) => {
      const { data, error } = await admin
        .from('talentos')
        .select('id, status, expires_at, cv_url')
        .eq('id', recordId)
        .maybeSingle();
      return {
        error,
        data: data
          ? { id: data.id, status: data.status, expires_at: data.expires_at, storedValue: data.cv_url }
          : null,
      };
    },
  },
  'job-attachment': {
    kind: 'job-attachment',
    categoryId: 'job-attachment',
    publicStatus: 'active',
    checkExpiry: false,
    load: async (admin, recordId) => {
      const { data, error } = await admin
        .from('vagas')
        .select('id, status, attachment_url')
        .eq('id', recordId)
        .maybeSingle();
      return {
        error,
        data: data
          ? { id: data.id, status: data.status, storedValue: data.attachment_url }
          : null,
      };
    },
  },
  'business-attachment': {
    kind: 'business-attachment',
    categoryId: 'business-attachment',
    publicStatus: 'active',
    checkExpiry: true,
    load: async (admin, recordId) => {
      const { data, error } = await admin
        .from('negocios')
        .select('id, status, expires_at, attachment_url')
        .eq('id', recordId)
        .maybeSingle();
      return {
        error,
        data: data
          ? { id: data.id, status: data.status, expires_at: data.expires_at, storedValue: data.attachment_url }
          : null,
      };
    },
  },
};

function isSignedFileKind(value: unknown): value is SignedFileKind {
  return typeof value === 'string' && value in KIND_MAP;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      kind?: unknown;
      recordId?: unknown;
      index?: unknown;
    };

    if (!isSignedFileKind(body.kind)) {
      return jsonError('Solicitação inválida.', 400);
    }

    const recordId = body.recordId;
    if (recordId === undefined || recordId === null || recordId === '') {
      return jsonError('Solicitação inválida.', 400);
    }

    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index > 20) {
      return jsonError('Solicitação inválida.', 400);
    }

    const config = KIND_MAP[body.kind];
    const category = STORAGE_CATEGORY_MAP[config.categoryId];
    const adminAuth = await requireAdmin(req);
    const isAdmin = adminAuth.ok;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: row, error } = await config.load(supabaseAdmin, recordId as string | number);

    if (error) {
      console.error('Signed URL lookup failed:', error.message);
      return jsonError('Não foi possível liberar o arquivo.', 500);
    }
    if (!row) {
      return jsonError('Arquivo indisponível.', 404);
    }

    if (!isAdmin) {
      if (row.status !== config.publicStatus) {
        return jsonError('Arquivo indisponível.', 404);
      }
      if (config.checkExpiry && !isWithinPublicWindow(row.expires_at)) {
        return jsonError('Arquivo indisponível.', 404);
      }
    }

    const storedValue = row.storedValue;
    const items = parseAttachments(storedValue);
    const item = items[index];
    if (!item?.url || !isStoragePath(item.url)) {
      return jsonError('Arquivo indisponível.', 404);
    }
    if (!isSafeStorageObjectPath(item.url, category.folder)) {
      return jsonError('Arquivo indisponível.', 404);
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(category.bucket)
      .createSignedUrl(item.url, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (signedError || !signed?.signedUrl) {
      console.error('createSignedUrl failed:', signedError?.message);
      return jsonError('Não foi possível liberar o arquivo.', 500);
    }

    return NextResponse.json({
      url: signed.signedUrl,
      expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    console.error('Signed URL route error:', error);
    return jsonError('Não foi possível liberar o arquivo.', 500);
  }
}
