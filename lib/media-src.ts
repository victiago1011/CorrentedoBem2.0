export type AttachmentItem = {
  name: string;
  url: string;
};

export function isDataUrl(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('data:');
}

export function isHttpUrl(value?: string | null): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

export function isStoragePath(value?: string | null): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !isDataUrl(trimmed) && !isHttpUrl(trimmed);
}

export function resolvePublicMediaSrc(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (isDataUrl(trimmed) || isHttpUrl(trimmed)) return trimmed;
  return undefined;
}

export function needsUnoptimizedMedia(value?: string | null): boolean {
  if (!value) return false;
  return isDataUrl(value) || value.includes('dicebear') || value.includes('gravatar');
}

export function getOpenableFileUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (isDataUrl(trimmed) || isHttpUrl(trimmed)) return trimmed;
  return undefined;
}

export function parseAttachments(
  urlOrJson: string | null | undefined,
  defaultName = 'Anexo'
): AttachmentItem[] {
  if (!urlOrJson) return [];
  try {
    const trimmed = urlOrJson.trim();
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: { name?: string; url?: string; data?: string }) => ({
            name: item.name || defaultName,
            url: item.url || item.data || '',
          }))
          .filter((item: AttachmentItem) => item.url);
      }
    }
  } catch {
    // ignore invalid JSON and treat as a single stored value
  }
  return [{ name: defaultName, url: urlOrJson }];
}

export function estimateStoredFileBytes(url: string, fallbackSize = 0): number {
  if (fallbackSize > 0) return fallbackSize;
  if (!isDataUrl(url)) return 0;
  const base64Str = url.split(',')[1] || '';
  return Math.ceil(base64Str.length * 0.75);
}

export function sanitizeIlikeTerm(raw: string): string {
  return raw
    .trim()
    .replace(/[%_,.()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
