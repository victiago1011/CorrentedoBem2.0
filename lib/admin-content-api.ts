import { supabase } from '@/lib/supabase';
import type { AdminContentType, StorageCleanupStatus } from '@/lib/storage-object-ref';

export class AdminContentApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AdminContentApiError';
    this.status = status;
  }
}

async function getAdminAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new AdminContentApiError('Faça login no painel administrativo.', 401);
  }
  return token;
}

async function adminContentRequest<T>(method: 'DELETE' | 'PATCH', body: unknown): Promise<T> {
  const token = await getAdminAccessToken();
  const response = await fetch('/api/admin/content', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new AdminContentApiError(
      payload && 'error' in payload && payload.error
        ? payload.error
        : 'Não foi possível concluir a operação administrativa.',
      response.status
    );
  }

  return payload as T;
}

export async function deleteAdminContent(
  type: AdminContentType,
  id: string | number
): Promise<{ deleted: true; cleanup: StorageCleanupStatus }> {
  return adminContentRequest('DELETE', { type, id });
}

export type AdminNoticiaUpdateInput = {
  id: string | number;
  title: string;
  content: string;
  excerpt?: string;
  image_url: string;
  author?: string;
  category?: string;
};

export async function updateAdminNoticiaWithImage<T = Record<string, unknown>>(
  input: AdminNoticiaUpdateInput
): Promise<{ updated: true; cleanup: StorageCleanupStatus; record: T }> {
  return adminContentRequest('PATCH', {
    type: 'noticia',
    ...input,
  });
}

export function adminCleanupToast(baseMessage: string, cleanup: StorageCleanupStatus): string {
  if (cleanup === 'partial') {
    return `${baseMessage} Alguns arquivos podem não ter sido excluídos.`;
  }
  return baseMessage;
}
