import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { supabase } from '@/lib/supabase';

const SEARCH_LIMIT = 10;

/** Escape ILIKE wildcards and strip unsafe chars for PostgREST filters. */
function sanitizeSearchTerm(raw: string): string {
  return raw
    .trim()
    .slice(0, 100)
    .replace(/[%_\\]/g, '')
    .replace(/[,.()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return auth.response;
  }

  const qRaw = req.nextUrl.searchParams.get('q') ?? '';
  const q = sanitizeSearchTerm(qRaw);

  try {
    let query = supabase
      .from('newsletter_subscribers')
      .select('id, nome, email')
      .eq('ativo', true)
      .order('nome', { ascending: true, nullsFirst: false })
      .order('email', { ascending: true })
      .limit(SEARCH_LIMIT);

    if (q) {
      // Quoted patterns avoid PostgREST misparsing of filter values
      query = query.or(`nome.ilike."%${q}%",email.ilike."%${q}%"`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[newsletter-subscribers/search]', error.message);
      return NextResponse.json(
        { error: 'Não foi possível buscar inscritos.', errorDetails: error.message },
        { status: 500 }
      );
    }

    const subscribers = (data ?? []).map((row) => ({
      id: row.id as string,
      nome: (row.nome as string | null) ?? null,
      email: row.email as string,
    }));

    return NextResponse.json({ subscribers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno na busca.';
    console.error('[newsletter-subscribers/search]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
