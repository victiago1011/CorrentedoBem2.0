import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Cliente Supabase com service_role — uso exclusivo em rotas/servidor.
 * Nunca importar em componentes client-side.
 * Instancia sob demanda (após requireAdmin na rota).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Configuração ausente: NEXT_PUBLIC_SUPABASE_URL não está definida no servidor.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Configuração ausente: SUPABASE_SERVICE_ROLE_KEY não está definida no servidor. ' +
        'Adicione a chave service_role do Supabase no .env.local (somente servidor).'
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
