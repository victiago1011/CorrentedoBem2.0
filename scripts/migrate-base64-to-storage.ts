/**
 * One-off: migra Base64 legado para Supabase Storage.
 * Padrão: DRY-RUN (sem upload, UPDATE ou remove).
 * Escrita somente com: --execute --confirm=MIGRATE_BASE64
 */
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { detectMimeFromMagicBytes, isMimeAllowed } from '@/lib/file-signature';
import { estimateStoredFileBytes, isDataUrl, isHttpUrl } from '@/lib/media-src';
import {
  extensionFromDetectedMime,
  getStorageCategory,
} from '@/lib/storage-categories';
import type { UploadCategoryId } from '@/lib/storage-config';
import { resolveStoredStorageObject } from '@/lib/storage-object-ref';

const PAGE_SIZE = 500;
const EXECUTE_CONFIRM = 'MIGRATE_BASE64';
const REQUIRED_EXECUTE_FLAGS = '--execute --confirm=MIGRATE_BASE64';

let writesEnabled = false;

type RefClass = 'empty' | 'base64' | 'storage' | 'external' | 'unknown';

type FieldSpec = {
  column: string;
  category: UploadCategoryId;
  defaultAttachmentName: string;
  scanOnly?: boolean;
};

type EntitySpec = {
  table: string;
  fields: FieldSpec[];
};

type DecodedFile = {
  declaredMime: string | null;
  bytes: Buffer;
  estimatedBytes: number;
};

type ValidatedFile = {
  declaredMime: string | null;
  detectedMime: string;
  bytes: Buffer;
  estimatedBytes: number;
  decodedBytes: number;
};

type FileOutcome =
  | { status: 'ok'; file: ValidatedFile }
  | { status: 'error'; reason: string; declaredMime: string | null; detectedMime: string | null; estimatedBytes: number; decodedBytes: number };

type PlannedFile = {
  index: number | null;
  sourceKey: 'url' | 'data' | 'scalar';
  declaredMime: string | null;
  detectedMime: string;
  estimatedBytes: number;
  decodedBytes: number;
};

type FieldPlan = {
  table: string;
  id: string;
  column: string;
  category: UploadCategoryId;
  scanOnly: boolean;
  raw: string;
  previousHash: string;
  shape: 'scalar' | 'json';
  jsonItems: unknown[] | null;
  wouldUpdate: boolean;
  atomicBlocked: boolean;
  blockReason: string | null;
  plannedFiles: PlannedFile[];
  alreadyStorage: number;
  external: number;
  empty: number;
  unknown: number;
  base64Count: number;
};

type ValidationErrorRow = {
  table: string;
  id: string;
  field: string;
  index: number | null;
  reason: string;
  declaredMime: string | null;
  detectedMime: string | null;
  estimatedBytes: number;
  decodedBytes: number;
};

type FieldCounters = {
  recordsAnalyzed: number;
  base64Found: number;
  migratable: number;
  alreadyStorage: number;
  external: number;
  empty: number;
  unknown: number;
  estimatedBytes: number;
  decodedBytes: number;
  validationErrors: number;
  recordsWouldUpdate: number;
  atomicBlocked: number;
  mimeCounts: Record<string, number>;
};

type ManifestEntry = {
  table: string;
  id: string;
  field: string;
  previousHash: string;
  newRefs: { bucket: string; path: string }[];
  timestamp: string;
  result: 'success' | 'skipped' | 'conflict' | 'failed';
  reason?: string;
};

const ENTITIES: EntitySpec[] = [
  {
    table: 'talentos',
    fields: [
      { column: 'image', category: 'talent-photo', defaultAttachmentName: 'Foto' },
      { column: 'cv_url', category: 'talent-cv', defaultAttachmentName: 'Currículo' },
    ],
  },
  {
    table: 'vagas',
    fields: [
      { column: 'logo_url', category: 'job-logo', defaultAttachmentName: 'Logo' },
      { column: 'attachment_url', category: 'job-attachment', defaultAttachmentName: 'Anexo' },
    ],
  },
  {
    table: 'negocios',
    fields: [
      { column: 'logo_url', category: 'business-logo', defaultAttachmentName: 'Logo' },
      { column: 'attachment_url', category: 'business-attachment', defaultAttachmentName: 'Anexo' },
    ],
  },
  {
    table: 'noticias',
    fields: [
      { column: 'image_url', category: 'news-image', defaultAttachmentName: 'Imagem' },
      {
        column: 'attachment_url',
        category: 'news-image',
        defaultAttachmentName: 'Anexo',
        scanOnly: true,
      },
    ],
  },
  {
    table: 'testimonials',
    fields: [
      { column: 'photo_url', category: 'testimonial-photo', defaultAttachmentName: 'Foto' },
    ],
  },
];

function parseCli(argv: string[]) {
  const execute = argv.includes('--execute');
  const confirmArg = argv.find((item) => item.startsWith('--confirm='));
  const confirm = confirmArg ? confirmArg.slice('--confirm='.length) : '';
  return { execute, confirm };
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function emptyCounters(): FieldCounters {
  return {
    recordsAnalyzed: 0,
    base64Found: 0,
    migratable: 0,
    alreadyStorage: 0,
    external: 0,
    empty: 0,
    unknown: 0,
    estimatedBytes: 0,
    decodedBytes: 0,
    validationErrors: 0,
    recordsWouldUpdate: 0,
    atomicBlocked: 0,
    mimeCounts: {},
  };
}

function bumpMime(counters: FieldCounters, mime: string | null) {
  const key = mime || 'desconhecido';
  counters.mimeCounts[key] = (counters.mimeCounts[key] || 0) + 1;
}

function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida.');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function coerceFieldValue(value: unknown): { raw: string | null; array: unknown[] | null; unknownType: boolean } {
  if (value === null || value === undefined) {
    return { raw: null, array: null, unknownType: false };
  }
  if (typeof value === 'string') {
    return { raw: value, array: null, unknownType: false };
  }
  if (Array.isArray(value)) {
    return { raw: JSON.stringify(value), array: value, unknownType: false };
  }
  return { raw: null, array: null, unknownType: true };
}

function tryParseJsonArray(raw: string): unknown[] | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function classifyUrl(value: string | null | undefined, category: UploadCategoryId): RefClass {
  if (value === null || value === undefined) return 'empty';
  const trimmed = value.trim();
  if (!trimmed) return 'empty';
  if (isDataUrl(trimmed)) return 'base64';
  if (resolveStoredStorageObject(trimmed, category)) return 'storage';
  if (isHttpUrl(trimmed)) return 'external';
  return 'unknown';
}

function itemUrl(item: Record<string, unknown>): { key: 'url' | 'data'; value: string } | null {
  if (typeof item.url === 'string' && item.url.trim()) {
    return { key: 'url', value: item.url };
  }
  if (typeof item.data === 'string' && item.data.trim()) {
    return { key: 'data', value: item.data };
  }
  return null;
}

function decodeDataUrl(value: string): { ok: true; decoded: DecodedFile } | { ok: false; reason: string } {
  const trimmed = value.trim();
  const comma = trimmed.indexOf(',');
  if (!trimmed.toLowerCase().startsWith('data:') || comma < 0) {
    return { ok: false, reason: 'data URI inválida' };
  }
  const header = trimmed.slice(5, comma);
  const payload = trimmed.slice(comma + 1).replace(/\s/g, '');
  const parts = header.split(';').map((part) => part.trim()).filter(Boolean);
  const declaredMime = parts[0] && !parts[0].toLowerCase().startsWith('base64') && !parts[0].toLowerCase().startsWith('charset=')
    ? parts[0].toLowerCase()
    : null;
  const isBase64 = parts.some((part) => part.toLowerCase() === 'base64');
  if (!isBase64) {
    return { ok: false, reason: 'data URI sem encoding base64' };
  }
  if (!payload) {
    return { ok: false, reason: 'payload Base64 vazio' };
  }
  try {
    const bytes = Buffer.from(payload, 'base64');
    if (bytes.length === 0) {
      return { ok: false, reason: 'arquivo decodificado vazio' };
    }
    return {
      ok: true,
      decoded: {
        declaredMime,
        bytes,
        estimatedBytes: estimateStoredFileBytes(trimmed),
      },
    };
  } catch {
    return { ok: false, reason: 'Base64 inválido' };
  }
}

function validateDecoded(decoded: DecodedFile, categoryId: UploadCategoryId): FileOutcome {
  const category = getStorageCategory(categoryId);
  if (!category) {
    return {
      status: 'error',
      reason: 'categoria inválida',
      declaredMime: decoded.declaredMime,
      detectedMime: null,
      estimatedBytes: decoded.estimatedBytes,
      decodedBytes: decoded.bytes.length,
    };
  }
  if (decoded.bytes.length > category.maxOriginalBytes) {
    return {
      status: 'error',
      reason: `excede o limite de ${category.maxOriginalBytes} bytes da categoria`,
      declaredMime: decoded.declaredMime,
      detectedMime: detectMimeFromMagicBytes(decoded.bytes),
      estimatedBytes: decoded.estimatedBytes,
      decodedBytes: decoded.bytes.length,
    };
  }
  const detectedMime = detectMimeFromMagicBytes(decoded.bytes);
  if (!detectedMime) {
    return {
      status: 'error',
      reason: 'assinatura de arquivo não reconhecida',
      declaredMime: decoded.declaredMime,
      detectedMime: null,
      estimatedBytes: decoded.estimatedBytes,
      decodedBytes: decoded.bytes.length,
    };
  }
  if (!isMimeAllowed(detectedMime, category.allowedMimeTypes)) {
    return {
      status: 'error',
      reason: `MIME detectado não permitido para a categoria (${detectedMime})`,
      declaredMime: decoded.declaredMime,
      detectedMime,
      estimatedBytes: decoded.estimatedBytes,
      decodedBytes: decoded.bytes.length,
    };
  }
  return {
    status: 'ok',
    file: {
      declaredMime: decoded.declaredMime,
      detectedMime,
      bytes: decoded.bytes,
      estimatedBytes: decoded.estimatedBytes,
      decodedBytes: decoded.bytes.length,
    },
  };
}

function inspectBase64(value: string, category: UploadCategoryId): FileOutcome {
  const decoded = decodeDataUrl(value);
  if (!decoded.ok) {
    return {
      status: 'error',
      reason: decoded.reason,
      declaredMime: null,
      detectedMime: null,
      estimatedBytes: estimateStoredFileBytes(value),
      decodedBytes: 0,
    };
  }
  return validateDecoded(decoded.decoded, category);
}

function storedValueFor(categoryId: UploadCategoryId, objectPath: string, supabase: SupabaseClient): string {
  const category = getStorageCategory(categoryId);
  if (!category) {
    throw new Error('categoria inválida');
  }
  if (category.visibility === 'public') {
    return supabase.storage.from(category.bucket).getPublicUrl(objectPath).data.publicUrl;
  }
  return objectPath;
}

function buildJsonAfterMigration(
  items: unknown[],
  replacements: Map<number, string>
): unknown[] {
  return items.map((item, index) => {
    const nextUrl = replacements.get(index);
    if (nextUrl === undefined || !item || typeof item !== 'object' || Array.isArray(item)) {
      return item;
    }
    const copy = { ...(item as Record<string, unknown>) };
    copy.url = nextUrl;
    if (typeof copy.data === 'string' && isDataUrl(copy.data)) {
      delete copy.data;
    }
    return copy;
  });
}

function nextObjectPath(categoryId: UploadCategoryId, mime: string): { bucket: string; path: string } {
  const category = getStorageCategory(categoryId);
  if (!category) {
    throw new Error('categoria inválida');
  }
  return {
    bucket: category.bucket,
    path: `${category.folder}/${randomUUID()}.${extensionFromDetectedMime(mime)}`,
  };
}

function planField(options: {
  table: string;
  id: string;
  spec: FieldSpec;
  raw: string | null;
  arrayHint: unknown[] | null;
  unknownType: boolean;
}): FieldPlan {
  const { table, id, spec, raw, arrayHint, unknownType } = options;
  const base: Omit<FieldPlan, 'shape' | 'jsonItems' | 'wouldUpdate' | 'atomicBlocked' | 'blockReason' | 'plannedFiles' | 'alreadyStorage' | 'external' | 'empty' | 'unknown' | 'base64Count'> & {
    raw: string;
  } = {
    table,
    id,
    column: spec.column,
    category: spec.category,
    scanOnly: Boolean(spec.scanOnly),
    raw: raw ?? '',
    previousHash: raw ? sha256(raw) : sha256(''),
  };

  if (unknownType) {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: 'tipo de coluna não textual',
      plannedFiles: [],
      alreadyStorage: 0,
      external: 0,
      empty: 0,
      unknown: 1,
      base64Count: 0,
    };
  }

  if (raw === null || raw.trim() === '') {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: null,
      plannedFiles: [],
      alreadyStorage: 0,
      external: 0,
      empty: 1,
      unknown: 0,
      base64Count: 0,
    };
  }

  const jsonItems = arrayHint ?? tryParseJsonArray(raw);
  if (jsonItems) {
    let alreadyStorage = 0;
    let external = 0;
    let empty = 0;
    let unknown = 0;
    let base64Count = 0;
    const plannedFiles: PlannedFile[] = [];
    const errors: string[] = [];

    jsonItems.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        unknown += 1;
        return;
      }
      const source = itemUrl(item as Record<string, unknown>);
      if (!source) {
        empty += 1;
        return;
      }
      const klass = classifyUrl(source.value, spec.category);
      if (klass === 'storage') {
        alreadyStorage += 1;
        return;
      }
      if (klass === 'external') {
        external += 1;
        return;
      }
      if (klass === 'empty') {
        empty += 1;
        return;
      }
      if (klass === 'unknown') {
        unknown += 1;
        return;
      }

      base64Count += 1;
      const outcome = inspectBase64(source.value, spec.category);
      if (outcome.status === 'error') {
        errors.push(outcome.reason);
        return;
      }
      plannedFiles.push({
        index,
        sourceKey: source.key,
        declaredMime: outcome.file.declaredMime,
        detectedMime: outcome.file.detectedMime,
        estimatedBytes: outcome.file.estimatedBytes,
        decodedBytes: outcome.file.decodedBytes,
      });
    });

    const atomicBlocked = base64Count > 0 && plannedFiles.length !== base64Count;
    const wouldUpdate =
      !spec.scanOnly && !atomicBlocked && plannedFiles.length > 0 && errors.length === 0;

    return {
      ...base,
      shape: 'json',
      jsonItems,
      wouldUpdate,
      atomicBlocked,
      blockReason: atomicBlocked
        ? 'campo JSON bloqueado: nem todos os Base64 passaram na validação'
        : spec.scanOnly && base64Count > 0
          ? 'campo fora do escopo desta fase'
          : null,
      plannedFiles: atomicBlocked || spec.scanOnly ? [] : plannedFiles,
      alreadyStorage,
      external,
      empty,
      unknown,
      base64Count,
    };
  }

  const klass = classifyUrl(raw, spec.category);
  if (klass === 'empty') {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: null,
      plannedFiles: [],
      alreadyStorage: 0,
      external: 0,
      empty: 1,
      unknown: 0,
      base64Count: 0,
    };
  }
  if (klass === 'storage') {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: null,
      plannedFiles: [],
      alreadyStorage: 1,
      external: 0,
      empty: 0,
      unknown: 0,
      base64Count: 0,
    };
  }
  if (klass === 'external') {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: null,
      plannedFiles: [],
      alreadyStorage: 0,
      external: 1,
      empty: 0,
      unknown: 0,
      base64Count: 0,
    };
  }
  if (klass === 'unknown') {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: 'formato desconhecido',
      plannedFiles: [],
      alreadyStorage: 0,
      external: 0,
      empty: 0,
      unknown: 1,
      base64Count: 0,
    };
  }

  const outcome = inspectBase64(raw, spec.category);
  if (outcome.status === 'error') {
    return {
      ...base,
      shape: 'scalar',
      jsonItems: null,
      wouldUpdate: false,
      atomicBlocked: false,
      blockReason: outcome.reason,
      plannedFiles: [],
      alreadyStorage: 0,
      external: 0,
      empty: 0,
      unknown: 0,
      base64Count: 1,
    };
  }

  return {
    ...base,
    shape: 'scalar',
    jsonItems: null,
    wouldUpdate: !spec.scanOnly,
    atomicBlocked: false,
    blockReason: spec.scanOnly ? 'campo fora do escopo desta fase' : null,
    plannedFiles: spec.scanOnly
      ? []
      : [
          {
            index: null,
            sourceKey: 'scalar',
            declaredMime: outcome.file.declaredMime,
            detectedMime: outcome.file.detectedMime,
            estimatedBytes: outcome.file.estimatedBytes,
            decodedBytes: outcome.file.decodedBytes,
          },
        ],
    alreadyStorage: 0,
    external: 0,
    empty: 0,
    unknown: 0,
    base64Count: 1,
  };
}

function collectFieldErrors(plan: FieldPlan, spec: FieldSpec): ValidationErrorRow[] {
  const rows: ValidationErrorRow[] = [];
  if (plan.shape === 'json' && plan.jsonItems) {
    plan.jsonItems.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;
      const source = itemUrl(item as Record<string, unknown>);
      if (!source || classifyUrl(source.value, spec.category) !== 'base64') return;
      const outcome = inspectBase64(source.value, spec.category);
      if (outcome.status === 'error') {
        rows.push({
          table: plan.table,
          id: plan.id,
          field: plan.column,
          index,
          reason: plan.atomicBlocked
            ? `${outcome.reason} (campo JSON mantido integralmente)`
            : outcome.reason,
          declaredMime: outcome.declaredMime,
          detectedMime: outcome.detectedMime,
          estimatedBytes: outcome.estimatedBytes,
          decodedBytes: outcome.decodedBytes,
        });
        return;
      }
      if (spec.scanOnly) {
        rows.push({
          table: plan.table,
          id: plan.id,
          field: plan.column,
          index,
          reason: 'campo fora do escopo desta fase',
          declaredMime: outcome.file.declaredMime,
          detectedMime: outcome.file.detectedMime,
          estimatedBytes: outcome.file.estimatedBytes,
          decodedBytes: outcome.file.decodedBytes,
        });
      }
    });
    return rows;
  }

  if (plan.base64Count === 1 && plan.plannedFiles.length === 0 && !plan.scanOnly) {
    const outcome = inspectBase64(plan.raw, spec.category);
    if (outcome.status === 'error') {
      rows.push({
        table: plan.table,
        id: plan.id,
        field: plan.column,
        index: null,
        reason: outcome.reason,
        declaredMime: outcome.declaredMime,
        detectedMime: outcome.detectedMime,
        estimatedBytes: outcome.estimatedBytes,
        decodedBytes: outcome.decodedBytes,
      });
    }
  }
  if (plan.scanOnly && classifyUrl(plan.raw, spec.category) === 'base64') {
    const outcome = inspectBase64(plan.raw, spec.category);
    rows.push({
      table: plan.table,
      id: plan.id,
      field: plan.column,
      index: null,
      reason: plan.blockReason || 'campo fora do escopo desta fase',
      declaredMime: outcome.status === 'ok' ? outcome.file.declaredMime : outcome.declaredMime,
      detectedMime: outcome.status === 'ok' ? outcome.file.detectedMime : outcome.detectedMime,
      estimatedBytes: outcome.status === 'ok' ? outcome.file.estimatedBytes : outcome.estimatedBytes,
      decodedBytes: outcome.status === 'ok' ? outcome.file.decodedBytes : outcome.decodedBytes,
    });
  }
  return rows;
}

async function fetchAllRows(
  supabase: SupabaseClient,
  table: string,
  columns: string[]
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select(['id', ...columns].join(', '))
      .order('id', { ascending: true })
      .range(from, to);
    if (error) {
      throw new Error(`Falha ao ler ${table}: ${error.message}`);
    }
    const batch = ((data ?? []) as unknown) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function removeUploaded(
  supabase: SupabaseClient,
  refs: { bucket: string; path: string }[]
): Promise<void> {
  if (!writesEnabled) {
    throw new Error('Proteção: storage.remove bloqueado fora do modo execute.');
  }
  const grouped = new Map<string, string[]>();
  for (const ref of refs) {
    const paths = grouped.get(ref.bucket) ?? [];
    paths.push(ref.path);
    grouped.set(ref.bucket, paths);
  }
  for (const [bucket, paths] of grouped) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error('Falha ao remover upload novo após erro (sem detalhes de arquivo).');
    }
  }
}

async function uploadBytes(
  supabase: SupabaseClient,
  categoryId: UploadCategoryId,
  file: ValidatedFile
): Promise<{ bucket: string; path: string }> {
  if (!writesEnabled) {
    throw new Error('Proteção: upload bloqueado fora do modo execute.');
  }
  const dest = nextObjectPath(categoryId, file.detectedMime);
  const { error } = await supabase.storage.from(dest.bucket).upload(dest.path, file.bytes, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.detectedMime,
  });
  if (error) {
    throw new Error('upload falhou');
  }
  return dest;
}

function nextStoredValue(
  plan: FieldPlan,
  spec: FieldSpec,
  replacements: Map<number, string>,
  scalarValue: string | null
): string {
  if (plan.shape === 'json' && plan.jsonItems) {
    return JSON.stringify(buildJsonAfterMigration(plan.jsonItems, replacements));
  }
  if (scalarValue === null) {
    throw new Error('valor escalar ausente');
  }
  const category = getStorageCategory(plan.category);
  if (category?.visibility === 'private') {
    return JSON.stringify([{ name: spec.defaultAttachmentName, url: scalarValue }]);
  }
  return scalarValue;
}

async function readFieldRaw(
  supabase: SupabaseClient,
  table: string,
  id: string,
  column: string
): Promise<{ ok: true; raw: string } | { ok: false; reason: string }> {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${column}`)
    .eq('id', id)
    .maybeSingle();
  const row = (data ?? null) as Record<string, unknown> | null;
  if (error || !row) {
    return { ok: false, reason: 'falha ao reler registro' };
  }
  const coerced = coerceFieldValue(row[column]);
  if (coerced.unknownType) {
    return { ok: false, reason: 'tipo de coluna não textual na releitura' };
  }
  return { ok: true, raw: coerced.raw ?? '' };
}

async function executePlan(
  supabase: SupabaseClient,
  spec: FieldSpec,
  plan: FieldPlan
): Promise<ManifestEntry> {
  const timestamp = new Date().toISOString();
  if (!plan.wouldUpdate) {
    return {
      table: plan.table,
      id: plan.id,
      field: plan.column,
      previousHash: plan.previousHash,
      newRefs: [],
      timestamp,
      result: 'skipped',
      reason: plan.blockReason || 'nada a migrar',
    };
  }

  const firstRead = await readFieldRaw(supabase, plan.table, plan.id, plan.column);
  if (!firstRead.ok) {
    return {
      table: plan.table,
      id: plan.id,
      field: plan.column,
      previousHash: plan.previousHash,
      newRefs: [],
      timestamp,
      result: 'failed',
      reason: firstRead.reason,
    };
  }
  if (sha256(firstRead.raw) !== plan.previousHash) {
    return {
      table: plan.table,
      id: plan.id,
      field: plan.column,
      previousHash: plan.previousHash,
      newRefs: [],
      timestamp,
      result: 'conflict',
      reason: 'campo alterado desde a leitura inicial',
    };
  }

  const uploaded: { bucket: string; path: string }[] = [];
  try {
    const replacements = new Map<number, string>();
    let scalarStored: string | null = null;

    if (plan.shape === 'json' && plan.jsonItems) {
      const prepared: { index: number; file: ValidatedFile }[] = [];
      for (const item of plan.plannedFiles) {
        if (item.index === null) continue;
        const rawItem = plan.jsonItems[item.index];
        if (!rawItem || typeof rawItem !== 'object') {
          throw new Error('item JSON ausente na segunda passagem');
        }
        const source = itemUrl(rawItem as Record<string, unknown>);
        if (!source || !isDataUrl(source.value)) {
          throw new Error('referência Base64 ausente na segunda passagem');
        }
        const outcome = inspectBase64(source.value, spec.category);
        if (outcome.status === 'error') {
          throw new Error(outcome.reason);
        }
        prepared.push({ index: item.index, file: outcome.file });
      }
      if (prepared.length !== plan.plannedFiles.length) {
        throw new Error('conjunto Base64 inconsistente');
      }
      for (const item of prepared) {
        const dest = await uploadBytes(supabase, spec.category, item.file);
        uploaded.push(dest);
        replacements.set(item.index, storedValueFor(spec.category, dest.path, supabase));
      }
    } else {
      const outcome = inspectBase64(plan.raw, spec.category);
      if (outcome.status === 'error') {
        throw new Error(outcome.reason);
      }
      const dest = await uploadBytes(supabase, spec.category, outcome.file);
      uploaded.push(dest);
      scalarStored = storedValueFor(spec.category, dest.path, supabase);
    }

    const secondRead = await readFieldRaw(supabase, plan.table, plan.id, plan.column);
    if (!secondRead.ok) {
      await removeUploaded(supabase, uploaded);
      return {
        table: plan.table,
        id: plan.id,
        field: plan.column,
        previousHash: plan.previousHash,
        newRefs: [],
        timestamp,
        result: 'failed',
        reason: `${secondRead.reason}; uploads novos removidos`,
      };
    }
    if (sha256(secondRead.raw) !== plan.previousHash) {
      await removeUploaded(supabase, uploaded);
      return {
        table: plan.table,
        id: plan.id,
        field: plan.column,
        previousHash: plan.previousHash,
        newRefs: [],
        timestamp,
        result: 'conflict',
        reason: 'campo alterado entre upload e UPDATE; uploads novos removidos',
      };
    }

    const nextValue = nextStoredValue(plan, spec, replacements, scalarStored);
    if (!writesEnabled) {
      throw new Error('Proteção: UPDATE bloqueado fora do modo execute.');
    }
    const { data: updated, error: updateError } = await supabase
      .from(plan.table)
      .update({ [plan.column]: nextValue })
      .eq('id', plan.id)
      .select('id');

    const updatedCount = Array.isArray(updated) ? updated.length : 0;
    if (updateError || updatedCount === 0) {
      await removeUploaded(supabase, uploaded);
      return {
        table: plan.table,
        id: plan.id,
        field: plan.column,
        previousHash: plan.previousHash,
        newRefs: [],
        timestamp,
        result: 'failed',
        reason: updateError ? 'UPDATE falhou; uploads novos removidos' : 'UPDATE não alterou linhas; uploads novos removidos',
      };
    }

    return {
      table: plan.table,
      id: plan.id,
      field: plan.column,
      previousHash: plan.previousHash,
      newRefs: uploaded,
      timestamp,
      result: 'success',
    };
  } catch (error) {
    await removeUploaded(supabase, uploaded);
    return {
      table: plan.table,
      id: plan.id,
      field: plan.column,
      previousHash: plan.previousHash,
      newRefs: [],
      timestamp,
      result: 'failed',
      reason: error instanceof Error ? error.message : 'falha na migração do campo',
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printSection(title: string, counters: FieldCounters) {
  console.log(`\n=== ${title} ===`);
  console.log(`Registros analisados: ${counters.recordsAnalyzed}`);
  console.log(`Referências Base64: ${counters.base64Found}`);
  console.log(`Arquivos migráveis: ${counters.migratable}`);
  console.log(`Já em Storage: ${counters.alreadyStorage}`);
  console.log(`URLs externas: ${counters.external}`);
  console.log(`Null/vazios: ${counters.empty}`);
  console.log(`Formatos desconhecidos: ${counters.unknown}`);
  console.log(`Erros de validação: ${counters.validationErrors}`);
  console.log(`Campos JSON bloqueados (atômico): ${counters.atomicBlocked}`);
  console.log(`Registros/campos que seriam atualizados: ${counters.recordsWouldUpdate}`);
  console.log(`Bytes Base64 estimados: ${formatBytes(counters.estimatedBytes)} (${counters.estimatedBytes})`);
  console.log(`Bytes decodificados: ${formatBytes(counters.decodedBytes)} (${counters.decodedBytes})`);
  const mimeKeys = Object.keys(counters.mimeCounts).sort();
  if (mimeKeys.length === 0) {
    console.log('MIME: (nenhum Base64 neste campo)');
  } else {
    console.log('MIME:');
    for (const mime of mimeKeys) {
      console.log(`  - ${mime}: ${counters.mimeCounts[mime]}`);
    }
  }
}

async function main() {
  const { execute, confirm } = parseCli(process.argv.slice(2));
  if (execute && confirm !== EXECUTE_CONFIRM) {
    console.error(`Proteção: escrita exige exatamente: ${REQUIRED_EXECUTE_FLAGS}`);
    process.exit(1);
  }
  const writeMode = execute && confirm === EXECUTE_CONFIRM;
  writesEnabled = writeMode;
  if (!writeMode) {
    console.log('Modo: DRY-RUN (nenhum upload, UPDATE ou remove será feito).');
  } else {
    console.log('Modo: EXECUTE — migração real.');
  }

  const supabase = createAdminClient();
  const perField = new Map<string, FieldCounters>();
  const totals = emptyCounters();
  const validationErrors: ValidationErrorRow[] = [];
  const wouldUpdate: { table: string; id: string; field: string; files: number }[] = [];
  const manifest: ManifestEntry[] = [];

  for (const entity of ENTITIES) {
    const columns = entity.fields.map((field) => field.column);
    const rows = await fetchAllRows(supabase, entity.table, columns);
    const seenIds = new Set<string>();

    for (const spec of entity.fields) {
      const key = `${entity.table}.${spec.column}`;
      const counters = emptyCounters();
      counters.recordsAnalyzed = rows.length;

      for (const row of rows) {
        const id = String(row.id ?? '');
        seenIds.add(id);
        const coerced = coerceFieldValue(row[spec.column]);
        const plan = planField({
          table: entity.table,
          id,
          spec,
          raw: coerced.raw,
          arrayHint: coerced.array,
          unknownType: coerced.unknownType,
        });

        counters.base64Found += plan.base64Count;
        counters.alreadyStorage += plan.alreadyStorage;
        counters.external += plan.external;
        counters.empty += plan.empty;
        counters.unknown += plan.unknown;
        if (plan.atomicBlocked) counters.atomicBlocked += 1;

        const errors = collectFieldErrors(plan, spec);
        counters.validationErrors += errors.length;
        validationErrors.push(...errors);

        if (plan.shape === 'json' && plan.jsonItems) {
          plan.jsonItems.forEach((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return;
            const source = itemUrl(item as Record<string, unknown>);
            if (!source || classifyUrl(source.value, spec.category) !== 'base64') return;
            const outcome = inspectBase64(source.value, spec.category);
            if (outcome.status === 'ok') {
              bumpMime(counters, outcome.file.detectedMime);
              counters.estimatedBytes += outcome.file.estimatedBytes;
              counters.decodedBytes += outcome.file.decodedBytes;
            } else {
              bumpMime(counters, outcome.detectedMime || outcome.declaredMime);
              counters.estimatedBytes += outcome.estimatedBytes;
              counters.decodedBytes += outcome.decodedBytes;
            }
          });
        } else if (plan.base64Count > 0) {
          const outcome = inspectBase64(plan.raw, spec.category);
          if (outcome.status === 'ok') {
            bumpMime(counters, outcome.file.detectedMime);
            counters.estimatedBytes += outcome.file.estimatedBytes;
            counters.decodedBytes += outcome.file.decodedBytes;
          } else {
            bumpMime(counters, outcome.detectedMime || outcome.declaredMime);
            counters.estimatedBytes += outcome.estimatedBytes;
            counters.decodedBytes += outcome.decodedBytes;
          }
        }

        counters.migratable += plan.plannedFiles.length;
        if (plan.wouldUpdate) {
          counters.recordsWouldUpdate += 1;
          wouldUpdate.push({
            table: plan.table,
            id: plan.id,
            field: plan.column,
            files: plan.plannedFiles.length,
          });
        }

        if (writeMode) {
          const entry = await executePlan(supabase, spec, plan);
          manifest.push(entry);
        }
      }

      perField.set(key, counters);
    }

    totals.recordsAnalyzed += seenIds.size;
  }

  for (const counters of perField.values()) {
    totals.base64Found += counters.base64Found;
    totals.migratable += counters.migratable;
    totals.alreadyStorage += counters.alreadyStorage;
    totals.external += counters.external;
    totals.empty += counters.empty;
    totals.unknown += counters.unknown;
    totals.estimatedBytes += counters.estimatedBytes;
    totals.decodedBytes += counters.decodedBytes;
    totals.validationErrors += counters.validationErrors;
    totals.recordsWouldUpdate += counters.recordsWouldUpdate;
    totals.atomicBlocked += counters.atomicBlocked;
    for (const [mime, count] of Object.entries(counters.mimeCounts)) {
      totals.mimeCounts[mime] = (totals.mimeCounts[mime] || 0) + count;
    }
  }

  for (const [key, counters] of perField) {
    printSection(key, counters);
  }
  printSection('TOTAL GERAL', totals);

  console.log('\nCampos que seriam atualizados (id técnico):');
  if (wouldUpdate.length === 0) {
    console.log('  (nenhum)');
  } else {
    for (const item of wouldUpdate) {
      console.log(`  - ${item.table} id=${item.id} campo=${item.field} arquivos=${item.files}`);
    }
  }

  if (validationErrors.length > 0) {
    console.log('\nErros de validação / bloqueios (sem conteúdo):');
    for (const error of validationErrors) {
      console.log(
        `  - ${error.table} id=${error.id} campo=${error.field} index=${error.index ?? '-'} motivo=${error.reason} mime=${error.detectedMime || error.declaredMime || '-'} bytes=${error.decodedBytes}`
      );
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(process.cwd(), 'scripts', 'reports');
  await mkdir(reportDir, { recursive: true });
  const reportPath = path.join(
    reportDir,
    `${writeMode ? 'migrate-base64-execute' : 'migrate-base64-dry-run'}-${stamp}.json`
  );
  const report = {
    mode: writeMode ? 'execute' : 'dry-run',
    generatedAt: new Date().toISOString(),
    perField: Object.fromEntries(perField),
    totals,
    wouldUpdate,
    validationErrors,
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nRelatório gravado em: ${reportPath}`);

  if (writeMode) {
    const manifestDir = path.join(process.cwd(), 'scripts', 'manifests');
    await mkdir(manifestDir, { recursive: true });
    const manifestPath = path.join(manifestDir, `migrate-base64-manifest-${stamp}.json`);
    await writeFile(
      manifestPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), entries: manifest }, null, 2),
      'utf8'
    );
    console.log(`Manifesto gravado em: ${manifestPath}`);
  } else {
    console.log('\nComando futuro da migração real (NÃO executar agora):');
    console.log(`npx tsx --env-file=.env.local scripts/migrate-base64-to-storage.ts ${REQUIRED_EXECUTE_FLAGS}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falha inesperada no migrador.');
  process.exit(1);
});
