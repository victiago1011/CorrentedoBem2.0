import 'server-only';

import { LEGAL_VERSION } from '@/lib/legal';
import { isDataUrl } from '@/lib/media-src';
import { GRAVATAR_PLACEHOLDER } from '@/lib/storage-config';
import { resolveStoredStorageObject } from '@/lib/storage-object-ref';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const PUBLIC_CONTENT_TYPES = ['talento', 'vaga', 'negocio', 'depoimento'] as const;
export type PublicContentType = (typeof PUBLIC_CONTENT_TYPES)[number];

export class PublicContentError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PublicContentError';
    this.status = status;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TALENTO_KEYS = [
  'name',
  'email',
  'phone',
  'location',
  'area',
  'role',
  'summary',
  'skills',
  'image',
  'cv_url',
  'terms_accepted',
  'privacy_consent',
] as const;

const VAGA_KEYS = [
  'title',
  'company',
  'email',
  'phone',
  'site_url',
  'location',
  'type',
  'area',
  'salary',
  'description',
  'attachment_url',
  'logo_url',
  'requirements',
  'terms_accepted',
] as const;

const NEGOCIO_KEYS = [
  'title',
  'owner_name',
  'contact_name',
  'contact_email',
  'contact_phone',
  'location',
  'link',
  'type',
  'area',
  'description',
  'attachment_url',
  'logo_url',
  'terms_accepted',
  'privacy_consent',
] as const;

const DEPOIMENTO_KEYS = [
  'name',
  'role',
  'company',
  'email',
  'content',
  'photo_url',
  'terms_accepted',
  'privacy_consent',
] as const;

export function isPublicContentType(value: unknown): value is PublicContentType {
  return typeof value === 'string' && (PUBLIC_CONTENT_TYPES as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(data: Record<string, unknown>, allowed: readonly string[]): void {
  const extra = Object.keys(data).filter((key) => !allowed.includes(key));
  if (extra.length > 0) {
    throw new PublicContentError('Payload contém campos não permitidos.');
  }
}

function requiredString(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string') {
    throw new PublicContentError(`O campo ${label} é obrigatório.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new PublicContentError(`O campo ${label} é obrigatório.`);
  }
  if (trimmed.length > max) {
    throw new PublicContentError(`O campo ${label} excede o tamanho permitido.`);
  }
  return trimmed;
}

function optionalString(value: unknown, label: string, max: number): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw new PublicContentError(`O campo ${label} é inválido.`);
  }
  if (value.length > max) {
    throw new PublicContentError(`O campo ${label} excede o tamanho permitido.`);
  }
  return value.trim();
}

function optionalHtml(value: unknown, label: string, max: number): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw new PublicContentError(`O campo ${label} é inválido.`);
  }
  if (value.length > max) {
    throw new PublicContentError(`O campo ${label} excede o tamanho permitido.`);
  }
  return value;
}

function requireTrue(value: unknown, message: string): void {
  if (value !== true) {
    throw new PublicContentError(message);
  }
}

function optionalEmail(value: unknown, label: string): string {
  const email = optionalString(value, label, 254);
  if (!email) return '';
  if (!EMAIL_REGEX.test(email)) {
    throw new PublicContentError(`Informe um ${label} válido.`);
  }
  return email;
}

function requiredEmail(value: unknown, label: string): string {
  const email = requiredString(value, label, 254);
  if (!EMAIL_REGEX.test(email)) {
    throw new PublicContentError(`Informe um ${label} válido.`);
  }
  return email;
}

function stringArray(value: unknown, label: string, maxItems: number, maxItemLength: number): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new PublicContentError(`O campo ${label} é inválido.`);
  }
  if (value.length > maxItems) {
    throw new PublicContentError(`O campo ${label} tem itens demais.`);
  }
  return value.map((item) => {
    if (typeof item !== 'string') {
      throw new PublicContentError(`O campo ${label} é inválido.`);
    }
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > maxItemLength) {
      throw new PublicContentError(`O campo ${label} contém um item inválido.`);
    }
    return trimmed;
  });
}

function requireOwnedMedia(value: string, category: Parameters<typeof resolveStoredStorageObject>[1], label: string): string {
  if (isDataUrl(value)) {
    throw new PublicContentError(`O campo ${label} não aceita Base64.`);
  }
  const resolved = resolveStoredStorageObject(value, category);
  if (!resolved) {
    throw new PublicContentError(`O campo ${label} não pertence ao armazenamento permitido.`);
  }
  return value.trim();
}

function optionalPublicImage(
  value: unknown,
  category: Parameters<typeof resolveStoredStorageObject>[1],
  label: string,
  emptyValue: string | null,
  allowGravatar = false
): string | null {
  if (value === undefined || value === null) return emptyValue;
  if (typeof value !== 'string') {
    throw new PublicContentError(`O campo ${label} é inválido.`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return emptyValue;
  if (allowGravatar && trimmed === GRAVATAR_PLACEHOLDER) return GRAVATAR_PLACEHOLDER;
  return requireOwnedMedia(trimmed, category, label);
}

function parseNamedAttachments(
  value: unknown,
  category: Parameters<typeof resolveStoredStorageObject>[1],
  label: string
): string | null {
  if (value === undefined || value === null || value === '') return null;

  let items: unknown;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      items = JSON.parse(trimmed);
    } catch {
      throw new PublicContentError(`O campo ${label} é inválido.`);
    }
  } else {
    items = value;
  }

  if (!Array.isArray(items)) {
    throw new PublicContentError(`O campo ${label} é inválido.`);
  }
  if (items.length > 10) {
    throw new PublicContentError(`O campo ${label} tem arquivos demais.`);
  }

  const normalized = items.map((item) => {
    if (!isPlainObject(item)) {
      throw new PublicContentError(`O campo ${label} é inválido.`);
    }
    const extra = Object.keys(item).filter((key) => key !== 'name' && key !== 'url');
    if (extra.length > 0) {
      throw new PublicContentError(`O campo ${label} contém campos não permitidos.`);
    }
    const name = requiredString(item.name, `${label}.name`, 200);
    if (typeof item.url !== 'string' || !item.url.trim()) {
      throw new PublicContentError(`O campo ${label} contém um arquivo inválido.`);
    }
    const url = requireOwnedMedia(item.url, category, label);
    return { name, url };
  });

  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

function consentTimestamp(): string {
  return new Date().toISOString();
}

function buildTalentoRow(data: Record<string, unknown>): Record<string, unknown> {
  rejectUnknownKeys(data, TALENTO_KEYS);
  requireTrue(data.terms_accepted, 'É necessário aceitar os Termos de Uso.');
  requireTrue(data.privacy_consent, 'É necessário aceitar a Política de Privacidade.');

  const acceptedAt = consentTimestamp();
  return {
    name: requiredString(data.name, 'nome', 200),
    email: requiredEmail(data.email, 'e-mail'),
    phone: requiredString(data.phone, 'telefone', 40),
    location: optionalString(data.location, 'localização', 200),
    area: requiredString(data.area, 'área', 120),
    role: optionalString(data.role, 'cargo', 200),
    summary: optionalHtml(data.summary, 'resumo', 50000),
    skills: stringArray(data.skills, 'habilidades', 40, 80),
    image: optionalPublicImage(data.image, 'talent-photo', 'image', GRAVATAR_PLACEHOLDER, true),
    cv_url: parseNamedAttachments(data.cv_url, 'talent-cv', 'cv_url') || '',
    status: 'pending',
    terms_accepted: true,
    terms_accepted_at: acceptedAt,
    terms_version: LEGAL_VERSION,
    privacy_consent: true,
    privacy_consent_at: acceptedAt,
    privacy_policy_version: LEGAL_VERSION,
  };
}

function buildVagaRow(data: Record<string, unknown>): Record<string, unknown> {
  rejectUnknownKeys(data, VAGA_KEYS);
  requireTrue(data.terms_accepted, 'É necessário aceitar os Termos de Uso.');

  const acceptedAt = consentTimestamp();
  const email = optionalEmail(data.email, 'e-mail');
  return {
    title: requiredString(data.title, 'título', 200),
    company: requiredString(data.company, 'empresa', 200),
    email,
    phone: optionalString(data.phone, 'telefone', 40),
    site_url: optionalString(data.site_url, 'site', 500),
    location: optionalString(data.location, 'localização', 200),
    type: requiredString(data.type, 'tipo', 80),
    area: requiredString(data.area, 'área', 120),
    salary: optionalString(data.salary, 'salário', 80),
    description: optionalHtml(data.description, 'descrição', 50000),
    attachment_url: parseNamedAttachments(data.attachment_url, 'job-attachment', 'attachment_url') || '',
    logo_url: optionalPublicImage(data.logo_url, 'job-logo', 'logo_url', null),
    requirements: stringArray(data.requirements, 'requisitos', 40, 500),
    status: 'pending',
    terms_accepted: true,
    terms_accepted_at: acceptedAt,
    terms_version: LEGAL_VERSION,
  };
}

function buildNegocioRow(data: Record<string, unknown>): Record<string, unknown> {
  rejectUnknownKeys(data, NEGOCIO_KEYS);
  requireTrue(data.terms_accepted, 'É necessário aceitar os Termos de Uso.');
  requireTrue(data.privacy_consent, 'É necessário aceitar a Política de Privacidade.');

  const acceptedAt = consentTimestamp();
  return {
    title: requiredString(data.title, 'título', 200),
    owner_name: requiredString(data.owner_name, 'nome do negócio', 200),
    contact_name: requiredString(data.contact_name, 'nome do responsável', 200),
    contact_email: optionalEmail(data.contact_email, 'e-mail de contato') || null,
    contact_phone: optionalString(data.contact_phone, 'telefone', 40) || null,
    location: optionalString(data.location, 'localização', 200) || null,
    link: optionalString(data.link, 'link', 500) || null,
    type: optionalString(data.type, 'tipo', 80) || null,
    area: optionalString(data.area, 'área', 120) || null,
    description: optionalHtml(data.description, 'descrição', 50000) || null,
    attachment_url: parseNamedAttachments(data.attachment_url, 'business-attachment', 'attachment_url'),
    logo_url: optionalPublicImage(data.logo_url, 'business-logo', 'logo_url', null),
    status: 'pending',
    terms_accepted: true,
    terms_accepted_at: acceptedAt,
    terms_version: LEGAL_VERSION,
    privacy_consent: true,
    privacy_consent_at: acceptedAt,
    privacy_policy_version: LEGAL_VERSION,
  };
}

function buildDepoimentoRow(data: Record<string, unknown>): Record<string, unknown> {
  rejectUnknownKeys(data, DEPOIMENTO_KEYS);
  requireTrue(data.terms_accepted, 'É necessário aceitar os Termos de Uso.');
  if (data.privacy_consent !== undefined) {
    requireTrue(data.privacy_consent, 'É necessário aceitar a Política de Privacidade.');
  }

  const acceptedAt = consentTimestamp();
  const email = optionalEmail(data.email, 'e-mail');
  return {
    name: requiredString(data.name, 'nome', 200),
    role: optionalString(data.role, 'cargo', 200),
    company: optionalString(data.company, 'empresa', 200),
    email: email || null,
    content: requiredString(data.content, 'depoimento', 8000),
    photo_url: optionalPublicImage(data.photo_url, 'testimonial-photo', 'photo_url', '') || '',
    status: 'pending',
    terms_accepted: true,
    terms_accepted_at: acceptedAt,
    terms_version: LEGAL_VERSION,
    privacy_consent: true,
    privacy_consent_at: acceptedAt,
    privacy_policy_version: LEGAL_VERSION,
  };
}

const BUILDERS: Record<PublicContentType, { table: string; build: (data: Record<string, unknown>) => Record<string, unknown> }> = {
  talento: { table: 'talentos', build: buildTalentoRow },
  vaga: { table: 'vagas', build: buildVagaRow },
  negocio: { table: 'negocios', build: buildNegocioRow },
  depoimento: { table: 'testimonials', build: buildDepoimentoRow },
};

export async function insertPublicContent(type: PublicContentType, data: unknown): Promise<void> {
  if (!isPlainObject(data)) {
    throw new PublicContentError('Payload inválido.');
  }

  const config = BUILDERS[type];
  const row = config.build(data);
  const admin = getSupabaseAdmin();
  const { error } = await admin.from(config.table).insert(row);

  if (error) {
    console.error('Public content insert failed', { type, message: error.message });
    throw new PublicContentError('Não foi possível enviar o cadastro. Tente novamente.', 500);
  }
}
