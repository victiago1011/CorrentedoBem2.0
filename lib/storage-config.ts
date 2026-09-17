export const STORAGE_BUCKETS = {
  publicMedia: 'public-media',
  privateDocuments: 'private-documents',
} as const;

export const STORAGE_FOLDERS = {
  talentPhoto: 'talentos/fotos',
  jobLogo: 'vagas/logos',
  businessLogo: 'negocios/logos',
  newsImage: 'noticias/imagens',
  testimonialPhoto: 'depoimentos/fotos',
  talentResume: 'talentos/curriculos',
  jobAttachment: 'vagas/anexos',
  businessAttachment: 'negocios/anexos',
} as const;

export const UPLOAD_LIMITS = {
  profileImageBytes: 5 * 1024 * 1024,
  logoImageBytes: 5 * 1024 * 1024,
  testimonialImageBytes: 5 * 1024 * 1024,
  newsImageBytes: 8 * 1024 * 1024,
  documentBytes: 3 * 1024 * 1024,
  documentsTotalBytes: 5 * 1024 * 1024,
} as const;

/** Limite do payload já processado na API (independente da seleção original 5 MB / 8 MB). */
export const API_UPLOAD_PAYLOAD_MAX_BYTES = Math.floor(4.5 * 1024 * 1024);

export const UPLOAD_CATEGORY_IDS = {
  talentPhoto: 'talent-photo',
  talentCv: 'talent-cv',
  jobLogo: 'job-logo',
  jobAttachment: 'job-attachment',
  businessLogo: 'business-logo',
  businessAttachment: 'business-attachment',
  testimonialPhoto: 'testimonial-photo',
  newsImage: 'news-image',
} as const;

export type UploadCategoryId = (typeof UPLOAD_CATEGORY_IDS)[keyof typeof UPLOAD_CATEGORY_IDS];

export const SIGNED_FILE_KINDS = {
  talentCv: 'talent-cv',
  jobAttachment: 'job-attachment',
  businessAttachment: 'business-attachment',
} as const;

export type SignedFileKind = (typeof SIGNED_FILE_KINDS)[keyof typeof SIGNED_FILE_KINDS];

export const SIGNED_URL_EXPIRES_IN_SECONDS = 120;

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MIXED_ATTACHMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
] as const;

export const GRAVATAR_PLACEHOLDER =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
