import { isDataUrl, isHttpUrl, parseAttachments } from '@/lib/media-src';
import { getStorageCategory, isSafeStorageObjectPath } from '@/lib/storage-categories';
import { STORAGE_BUCKETS, type UploadCategoryId } from '@/lib/storage-config';

export type ValidatedStorageObject = {
  bucket: string;
  path: string;
};

export type StorageCleanupStatus = 'ok' | 'partial' | 'none';

export const ADMIN_CONTENT_TYPES = {
  talento: {
    table: 'talentos',
    media: [
      { column: 'image', category: 'talent-photo' },
      { column: 'cv_url', category: 'talent-cv' },
    ],
  },
  vaga: {
    table: 'vagas',
    media: [
      { column: 'logo_url', category: 'job-logo' },
      { column: 'attachment_url', category: 'job-attachment' },
    ],
  },
  negocio: {
    table: 'negocios',
    media: [
      { column: 'logo_url', category: 'business-logo' },
      { column: 'attachment_url', category: 'business-attachment' },
    ],
  },
  noticia: {
    table: 'noticias',
    media: [
      { column: 'image_url', category: 'news-image' },
      { column: 'attachment_url', category: 'news-image' },
    ],
  },
  depoimento: {
    table: 'testimonials',
    media: [{ column: 'photo_url', category: 'testimonial-photo' }],
  },
} as const;

export type AdminContentType = keyof typeof ADMIN_CONTENT_TYPES;

export function isAdminContentType(value: unknown): value is AdminContentType {
  return typeof value === 'string' && value in ADMIN_CONTENT_TYPES;
}

function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin.toLowerCase();
  } catch {
    return null;
  }
}

function decodePathname(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname);
    if (decoded.includes('..') || decoded.includes('\\') || decoded.includes('\0')) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function parseOwnedPublicMediaUrl(
  value: string,
  folder: string
): ValidatedStorageObject | null {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (parsed.username || parsed.password) return null;

  const origin = supabaseOrigin();
  if (!origin || parsed.origin.toLowerCase() !== origin) return null;

  const pathname = decodePathname(parsed.pathname);
  if (!pathname) return null;

  const prefix = `/storage/v1/object/public/${STORAGE_BUCKETS.publicMedia}/`;
  if (!pathname.startsWith(prefix)) return null;

  const objectPath = pathname.slice(prefix.length);
  if (!isSafeStorageObjectPath(objectPath, folder)) return null;

  return { bucket: STORAGE_BUCKETS.publicMedia, path: objectPath };
}

export function resolveStoredStorageObject(
  value: string | null | undefined,
  categoryId: UploadCategoryId
): ValidatedStorageObject | null {
  const category = getStorageCategory(categoryId);
  if (!category || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isDataUrl(trimmed)) return null;

  if (isHttpUrl(trimmed)) {
    if (category.visibility !== 'public') return null;
    return parseOwnedPublicMediaUrl(trimmed, category.folder);
  }

  if (!isSafeStorageObjectPath(trimmed, category.folder)) return null;
  return { bucket: category.bucket, path: trimmed };
}

function uniqueObjects(objects: ValidatedStorageObject[]): ValidatedStorageObject[] {
  const seen = new Set<string>();
  const result: ValidatedStorageObject[] = [];
  for (const object of objects) {
    const key = `${object.bucket}:${object.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(object);
  }
  return result;
}

export function extractStorageObjectsFromField(
  value: string | null | undefined,
  categoryId: UploadCategoryId
): ValidatedStorageObject[] {
  if (!value) return [];
  return uniqueObjects(
    parseAttachments(value)
      .map((item) => resolveStoredStorageObject(item.url, categoryId))
      .filter((item): item is ValidatedStorageObject => item !== null)
  );
}

export function extractStorageObjectsFromRow(
  type: AdminContentType,
  row: Record<string, unknown>
): ValidatedStorageObject[] {
  const objects: ValidatedStorageObject[] = [];
  for (const field of ADMIN_CONTENT_TYPES[type].media) {
    const raw = row[field.column];
    if (typeof raw !== 'string' && raw !== null && raw !== undefined) continue;
    objects.push(...extractStorageObjectsFromField(raw as string | null | undefined, field.category));
  }
  return uniqueObjects(objects);
}
