import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type RequireAdminResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

/**
 * Valida que a requisição possui um Bearer token de um usuário
 * autenticado no Supabase Auth (modelo atual: qualquer usuário Auth = admin).
 * Não utiliza service_role.
 */
export async function requireAdmin(req: NextRequest): Promise<RequireAdminResult> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Não autenticado. Faça login no painel administrativo.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Não autenticado. Token ausente.' },
        { status: 401 }
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Sessão inválida ou expirada. Faça login novamente.' },
        { status: 401 }
      ),
    };
  }

  return { ok: true, user: data.user };
}
