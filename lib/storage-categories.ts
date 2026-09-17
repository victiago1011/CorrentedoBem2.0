import {
  API_UPLOAD_PAYLOAD_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MIXED_ATTACHMENT_MIME_TYPES,
  STORAGE_BUCKETS,
  STORAGE_FOLDERS,
  UPLOAD_LIMITS,
  type UploadCategoryId,
} from '@/lib/storage-config';

export type StorageVisibility = 'public' | 'private';

export type StorageCategoryConfig = {
  id: UploadCategoryId;
  bucket: string;
  folder: string;
  allowedMimeTypes: readonly string[];
  maxOriginalBytes: number;
  maxPayloadBytes: number;
  visibility: StorageVisibility;
  adminOnly: boolean;
  imagePreset?: 'profile' | 'logo' | 'testimonial' | 'news';
};

const PAYLOAD_CAP = API_UPLOAD_PAYLOAD_MAX_BYTES;

export const STORAGE_CATEGORY_MAP: Record<UploadCategoryId, StorageCategoryConfig> = {
  'talent-photo': {
    id: 'talent-photo',
    bucket: STORAGE_BUCKETS.publicMedia,
    folder: STORAGE_FOLDERS.talentPhoto,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.profileImageBytes,
    maxPayloadBytes: PAYLOAD_CAP,
    visibility: 'public',
    adminOnly: false,
    imagePreset: 'profile',
  },
  'talent-cv': {
    id: 'talent-cv',
    bucket: STORAGE_BUCKETS.privateDocuments,
    folder: STORAGE_FOLDERS.talentResume,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.documentBytes,
    maxPayloadBytes: Math.min(UPLOAD_LIMITS.documentBytes, PAYLOAD_CAP),
    visibility: 'private',
    adminOnly: false,
  },
  'job-logo': {
    id: 'job-logo',
    bucket: STORAGE_BUCKETS.publicMedia,
    folder: STORAGE_FOLDERS.jobLogo,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.logoImageBytes,
    maxPayloadBytes: PAYLOAD_CAP,
    visibility: 'public',
    adminOnly: false,
    imagePreset: 'logo',
  },
  'job-attachment': {
    id: 'job-attachment',
    bucket: STORAGE_BUCKETS.privateDocuments,
    folder: STORAGE_FOLDERS.jobAttachment,
    allowedMimeTypes: MIXED_ATTACHMENT_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.documentBytes,
    maxPayloadBytes: Math.min(UPLOAD_LIMITS.documentBytes, PAYLOAD_CAP),
    visibility: 'private',
    adminOnly: false,
  },
  'business-logo': {
    id: 'business-logo',
    bucket: STORAGE_BUCKETS.publicMedia,
    folder: STORAGE_FOLDERS.businessLogo,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.logoImageBytes,
    maxPayloadBytes: PAYLOAD_CAP,
    visibility: 'public',
    adminOnly: false,
    imagePreset: 'logo',
  },
  'business-attachment': {
    id: 'business-attachment',
    bucket: STORAGE_BUCKETS.privateDocuments,
    folder: STORAGE_FOLDERS.businessAttachment,
    allowedMimeTypes: MIXED_ATTACHMENT_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.documentBytes,
    maxPayloadBytes: Math.min(UPLOAD_LIMITS.documentBytes, PAYLOAD_CAP),
    visibility: 'private',
    adminOnly: false,
  },
  'testimonial-photo': {
    id: 'testimonial-photo',
    bucket: STORAGE_BUCKETS.publicMedia,
    folder: STORAGE_FOLDERS.testimonialPhoto,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.testimonialImageBytes,
    maxPayloadBytes: PAYLOAD_CAP,
    visibility: 'public',
    adminOnly: false,
    imagePreset: 'testimonial',
  },
  'news-image': {
    id: 'news-image',
    bucket: STORAGE_BUCKETS.publicMedia,
    folder: STORAGE_FOLDERS.newsImage,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxOriginalBytes: UPLOAD_LIMITS.newsImageBytes,
    maxPayloadBytes: PAYLOAD_CAP,
    visibility: 'public',
    adminOnly: true,
    imagePreset: 'news',
  },
};

export function isUploadCategoryId(value: unknown): value is UploadCategoryId {
  return typeof value === 'string' && value in STORAGE_CATEGORY_MAP;
}

export function getStorageCategory(value: unknown): StorageCategoryConfig | null {
  if (!isUploadCategoryId(value)) return null;
  return STORAGE_CATEGORY_MAP[value];
}

export function extensionFromDetectedMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'application/msword') return 'doc';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  return 'bin';
}

export function isSafeStorageObjectPath(path: string, folder: string): boolean {
  const trimmed = path.trim();
  if (!trimmed || trimmed.length > 500) return false;
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) return false;
  const prefix = `${folder.replace(/\/$/, '')}/`;
  if (!trimmed.startsWith(prefix)) return false;
  const rest = trimmed.slice(prefix.length);
  return /^[A-Za-z0-9._-]+$/.test(rest);
}
