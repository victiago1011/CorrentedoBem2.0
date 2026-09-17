import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TTL_MS = 30 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;

function getAbortSecret(): string {
  const secret = process.env.STORAGE_ABORT_SECRET;
  if (!secret || secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error('STORAGE_ABORT_SECRET is not configured.');
  }
  return secret.trim();
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function assertAbortSecretConfigured(): void {
  getAbortSecret();
}

export function createAbortToken(bucket: string, path: string): string {
  const secret = getAbortSecret();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${bucket}:${path}:${expiresAt}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload, secret)}`;
}

export function verifyAbortToken(token: string): { bucket: string; path: string } | null {
  try {
    const secret = getAbortSecret();
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const expected = sign(payload, secret);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

    const firstColon = payload.indexOf(':');
    const lastColon = payload.lastIndexOf(':');
    if (firstColon <= 0 || lastColon <= firstColon) return null;
    const bucket = payload.slice(0, firstColon);
    const path = payload.slice(firstColon + 1, lastColon);
    const expiresAt = Number(payload.slice(lastColon + 1));
    if (!bucket || !path || !Number.isFinite(expiresAt)) return null;
    if (Date.now() > expiresAt) return null;
    if (bucket.includes('..') || path.includes('..')) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}
