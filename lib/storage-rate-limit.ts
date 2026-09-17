const WINDOW_MS = 10 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 30;

type WindowState = {
  count: number;
  resetAt: number;
};

const uploadWindows = new Map<string, WindowState>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 64);
  return 'unknown';
}

function pruneExpired(now: number) {
  if (uploadWindows.size < 500) return;
  for (const [key, value] of uploadWindows) {
    if (value.resetAt <= now) uploadWindows.delete(key);
  }
}

export function assertUploadRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  pruneExpired(now);
  const current = uploadWindows.get(ip);
  if (!current || current.resetAt <= now) {
    uploadWindows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (current.count >= MAX_UPLOADS_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { ok: true };
}
