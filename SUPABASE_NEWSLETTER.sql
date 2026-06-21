-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO DE CAMPANHAS & CONTATOS
-- ==========================================
-- Copie e execute este script no SQL Editor do seu painel do Supabase.

-- 1. Criação da tabela de assinantes da newsletter / campanhas
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  nome text,
  email text unique not null,
  ativo boolean default true,
  cliques_count int default 0,
  ultimo_clique timestamp with time zone,
  clicou_no_mes boolean default false,
  data_cadastro timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Habilitar segurança Row Level Security (RLS)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 3. Criação de políticas de segurança (Policies) para permitir operações básicas
-- Permitir que qualquer pessoa se descadastre através do e-mail (atualizando seu próprio registro pelo ID/Email)
CREATE POLICY "Permitir leitura/atualização pública" ON public.newsletter_subscribers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Permissões explícitas (Grants) para a API do Supabase (Essencial pós-Maio/2026)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
