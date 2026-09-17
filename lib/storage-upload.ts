import { optimizeImageFile } from '@/lib/optimize-image';
import { getStorageCategory } from '@/lib/storage-categories';
import {
  API_UPLOAD_PAYLOAD_MAX_BYTES,
  type SignedFileKind,
  type UploadCategoryId,
} from '@/lib/storage-config';
import { supabase } from '@/lib/supabase';
import { getOpenableFileUrl, isStoragePath } from '@/lib/media-src';

export type StorageObjectRef = {
  bucket: string;
  path: string;
  publicUrl?: string;
  deleteToken?: string;
};

export class StorageUploadError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'StorageUploadError';
    this.status = status;
  }
}

const PAYLOAD_TOO_LARGE_MESSAGE =
  'O arquivo processado excede o limite de envio do servidor. Se for uma imagem, tente compactá-la mais ou usar outro formato. Se for um documento, envie um arquivo menor.';

export function validateFile(file: File | Blob, allowedMimeTypes: readonly string[], maxBytes: number): void {
  if (file.size <= 0) {
    throw new StorageUploadError('O arquivo enviado está vazio.');
  }
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    throw new StorageUploadError(`O arquivo excede o limite de ${maxMb}MB.`);
  }
  const mime = (file.type || '').toLowerCase();
  if (!mime || !allowedMimeTypes.includes(mime)) {
    throw new StorageUploadError('Tipo de arquivo não permitido.');
  }
}

async function getAdminAccessToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function postFileToApi(category: UploadCategoryId, file: File | Blob, originalName?: string): Promise<StorageObjectRef> {
  const config = getStorageCategory(category);
  if (!config) {
    throw new StorageUploadError('Categoria de arquivo inválida.');
  }
  if (file.size > config.maxPayloadBytes || file.size > API_UPLOAD_PAYLOAD_MAX_BYTES) {
    throw new StorageUploadError(PAYLOAD_TOO_LARGE_MESSAGE, 413);
  }

  const formData = new FormData();
  formData.append('category', category);
  const filename = originalName || (file instanceof File ? file.name : 'arquivo');
  formData.append('file', file, filename);

  const headers: HeadersInit = {};
  if (config.adminOnly) {
    const token = await getAdminAccessToken();
    if (!token) {
      throw new StorageUploadError('Faça login no painel administrativo para enviar este arquivo.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; bucket?: string; path?: string; publicUrl?: string | null; deleteToken?: string | null }
    | null;

  if (!response.ok) {
    throw new StorageUploadError(
      payload?.error || 'Não foi possível enviar o arquivo. Tente novamente em instantes.',
      response.status
    );
  }
  if (!payload?.bucket || !payload.path) {
    throw new StorageUploadError('Resposta inválida do servidor de arquivos.');
  }

  return {
    bucket: payload.bucket,
    path: payload.path,
    publicUrl: payload.publicUrl || undefined,
    deleteToken: payload.deleteToken || undefined,
  };
}

export async function uploadToStorage(options: {
  category: UploadCategoryId;
  file: File | Blob;
  originalName?: string;
}): Promise<StorageObjectRef> {
  const config = getStorageCategory(options.category);
  if (!config) {
    throw new StorageUploadError('Categoria de arquivo inválida.');
  }
  validateFile(options.file, config.allowedMimeTypes, config.maxOriginalBytes);
  return postFileToApi(options.category, options.file, options.originalName);
}

export async function uploadPublicImage(options: {
  category: UploadCategoryId;
  file: File | Blob;
  originalName?: string;
}): Promise<StorageObjectRef> {
  const config = getStorageCategory(options.category);
  if (!config?.imagePreset) {
    throw new StorageUploadError('Categoria de imagem inválida.');
  }
  validateFile(options.file, config.allowedMimeTypes, config.maxOriginalBytes);
  const optimized = await optimizeImageFile(
    options.file,
    config.imagePreset,
    options.originalName || (options.file instanceof File ? options.file.name : 'image')
  );
  if (optimized.size > config.maxPayloadBytes || optimized.size > API_UPLOAD_PAYLOAD_MAX_BYTES) {
    throw new StorageUploadError(PAYLOAD_TOO_LARGE_MESSAGE, 413);
  }
  return postFileToApi(options.category, optimized, optimized.name);
}

export async function removeUploaded(refs: StorageObjectRef[]): Promise<void> {
  await Promise.all(
    refs.map(async (ref) => {
      if (!ref.deleteToken) return;
      try {
        const response = await fetch('/api/storage/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteToken: ref.deleteToken }),
        });
        if (!response.ok) {
          console.error('Falha ao remover arquivo recém-enviado após erro de gravação.');
        }
      } catch (error) {
        console.error('Falha ao remover arquivo recém-enviado após erro de gravação:', error);
      }
    })
  );
}

export async function persistAfterUpload<T>(
  uploaded: StorageObjectRef[],
  persist: () => Promise<T>
): Promise<T> {
  try {
    return await persist();
  } catch (error) {
    await removeUploaded(uploaded);
    throw error;
  }
}

export async function requestSignedFileUrl(options: {
  kind: SignedFileKind;
  recordId: string | number;
  index: number;
  useAdminSession?: boolean;
}): Promise<string> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (options.useAdminSession) {
    const token = await getAdminAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/storage/signed-url', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      kind: options.kind,
      recordId: options.recordId,
      index: options.index,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !payload?.url) {
    throw new StorageUploadError(payload?.error || 'Não foi possível abrir o arquivo.');
  }
  return payload.url;
}

export async function openStoredAttachment(options: {
  url: string;
  name?: string;
  kind: SignedFileKind;
  recordId: string | number;
  index: number;
  useAdminSession?: boolean;
}): Promise<void> {
  const direct = getOpenableFileUrl(options.url);
  if (direct) {
    const link = document.createElement('a');
    link.href = direct;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (options.name) link.download = options.name;
    link.click();
    return;
  }

  if (!isStoragePath(options.url)) {
    throw new StorageUploadError('Arquivo indisponível.');
  }

  const signedUrl = await requestSignedFileUrl(options);
  window.open(signedUrl, '_blank', 'noopener,noreferrer');
}
