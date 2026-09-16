export const LEGAL_VERSION = '2026-09-16';
export const TALENT_PUBLICATION_DAYS = 90;

export function getTalentPublicationWindow(from: Date = new Date()) {
  const publishedAt = from.toISOString();
  const expiresAt = new Date(
    from.getTime() + TALENT_PUBLICATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    published_at: publishedAt,
    expires_at: expiresAt,
  };
}
