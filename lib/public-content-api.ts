export class PublicContentApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'PublicContentApiError';
    this.status = status;
  }
}

export type PublicContentType = 'talento' | 'vaga' | 'negocio' | 'depoimento';

export async function submitPublicContent(
  type: PublicContentType,
  data: Record<string, unknown>
): Promise<void> {
  const response = await fetch('/api/public/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new PublicContentApiError(
      payload?.error || 'Não foi possível enviar o cadastro. Tente novamente.',
      response.status
    );
  }
}
