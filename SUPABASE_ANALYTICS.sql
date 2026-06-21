-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO DE CONTROLE DE ACESSOS (ANALYTICS)
-- ==========================================
-- Copie e execute este script no SQL Editor do seu painel do Supabase.

CREATE TABLE IF NOT EXISTS public.site_analytics (
  id uuid default gen_random_uuid() primary key,
  visit_date date unique not null default current_date,
  pageviews_count int default 1,
  unique_visitors_count int default 1
);

-- Habilitar RLS
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e atualizações/inserções públicas para podermos somar as visitas anonimamente
CREATE POLICY "Permitir inserções e atualizações públicas de visualização" ON public.site_analytics
  FOR ALL USING (true) WITH CHECK (true);

-- Permissões de escrita
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_analytics TO anon, authenticated, service_role;
