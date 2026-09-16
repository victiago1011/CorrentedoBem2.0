export const LEGAL_VERSION = '2026-09-16';
export const PUBLICATION_MONTHS = 6;

function addCalendarMonths(from: Date, months: number): Date {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const day = from.getUTCDate();
  let targetMonth = month + months;
  const yearDelta = Math.floor(targetMonth / 12);
  let targetYear = year + yearDelta;
  targetMonth -= yearDelta * 12;
  if (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    Math.min(day, lastDay),
    from.getUTCHours(),
    from.getUTCMinutes(),
    from.getUTCSeconds(),
    from.getUTCMilliseconds()
  ));
}

export function getPublicationWindow(from: Date = new Date()) {
  const publishedAt = from.toISOString();
  const expiresAt = addCalendarMonths(from, PUBLICATION_MONTHS).toISOString();

  return {
    published_at: publishedAt,
    expires_at: expiresAt,
  };
}

export function getTalentPublicationWindow(from: Date = new Date()) {
  return getPublicationWindow(from);
}

export function publicUnexpiredOrFilter(now: Date = new Date()) {
  return `expires_at.is.null,expires_at.gt.${now.toISOString()}`;
}

export function isWithinPublicWindow(expiresAt?: string | null, now: Date = new Date()) {
  if (!expiresAt) return true;
  return new Date(expiresAt) > now;
}
