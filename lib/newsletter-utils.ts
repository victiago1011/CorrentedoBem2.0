import type { SupabaseClient } from '@supabase/supabase-js';

export const NEWSLETTER_PAGE_SIZE = 1000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  return EMAIL_REGEX.test(normalized);
}

export interface NewsletterSubscriberRow {
  id: string;
  nome: string | null;
  email: string;
  ativo?: boolean;
  cliques_count?: number;
  ultimo_clique?: string | null;
  clicou_no_mes?: boolean;
  data_cadastro?: string;
}

export async function fetchAllNewsletterSubscribers(
  supabase: SupabaseClient,
  options?: { activeOnly?: boolean; columns?: string }
): Promise<NewsletterSubscriberRow[]> {
  const columns = options?.columns ?? '*';
  const allRows: NewsletterSubscriberRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('newsletter_subscribers')
      .select(columns)
      .order('data_cadastro', { ascending: false })
      .range(from, from + NEWSLETTER_PAGE_SIZE - 1);

    if (options?.activeOnly) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...(data as unknown as NewsletterSubscriberRow[]));
    if (data.length < NEWSLETTER_PAGE_SIZE) break;
    from += NEWSLETTER_PAGE_SIZE;
  }

  return allRows;
}

export async function fetchNewsletterCounts(supabase: SupabaseClient): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  const [totalRes, activeRes] = await Promise.all([
    supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
    supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true),
  ]);

  if (totalRes.error) throw totalRes.error;
  if (activeRes.error) throw activeRes.error;

  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;

  return { total, active, inactive: total - active };
}
