-- ==========================================
-- 1. CRIAÇÃO DAS TABELAS (NOVO PADRÃO)
-- ==========================================

-- Tabela de Vagas
CREATE TABLE IF NOT EXISTS public.vagas (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text,
  email text,
  phone text,
  site_url text,
  attachment_url text,
  logo_url text,
  type text not null,
  area text not null default 'Outros',
  salary text,
  description text,
  requirements text[],
  status text default 'pending', 
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Talentos
CREATE TABLE IF NOT EXISTS public.talentos (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  location text,
  area text not null,
  role text,
  summary text,
  skills text[],
  image text,
  cv_url text,
  status text default 'pending',
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Negócios
CREATE TABLE IF NOT EXISTS public.negocios (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  owner_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  location text,
  link text,
  logo_url text,
  type text,
  area text,
  description text,
  attachment_url text,
  status text default 'pending',
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Histórico
CREATE TABLE IF NOT EXISTS public.history (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Notícias
CREATE TABLE IF NOT EXISTS public.noticias (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  image_url text,
  attachment_url text,
  author text,
  category text,
  status text default 'pending', -- pending, active, archived
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS public.settings (
  id int8 primary key default 1,
  platform_name text default 'Corrente do Bem',
  contact_email text,
  manual_approval boolean default true,
  auto_notifications boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Contatos (Mensagens recebidas)
CREATE TABLE IF NOT EXISTS public.contatos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  email text not null,
  assunto text,
  mensagem text not null,
  lida boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Depoimentos
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  company text,
  content text not null,
  photo_url text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- 2. MIGRAÇÃO DE DADOS (JOBS -> VAGAS)
-- ==========================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'jobs') THEN
        INSERT INTO public.vagas (id, title, company, location, type, status, salary, description, requirements, verified, created_at, area)
        SELECT 
            id, 
            title, 
            company, 
            location, 
            type, 
            CASE WHEN status = 'approved' THEN 'active' ELSE status END, -- Padroniza status
            salary, 
            description, 
            requirements, 
            verified, 
            created_at, 
            COALESCE(area, 'Geral')
        FROM public.jobs
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ==========================================
-- 3. MIGRAÇÃO DE DADOS (CANDIDATES -> TALENTOS)
-- ==========================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidates') THEN
        -- Como a coluna resume_url pode não existir, usamos um bloco dinâmico ou verificamos a coluna
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'resume_url') THEN
            INSERT INTO public.talentos (id, name, location, area, status, role, summary, skills, image, verified, created_at, cv_url)
            SELECT 
                id, name, location, area, 
                CASE WHEN status = 'approved' THEN 'active' ELSE status END, 
                role, summary, skills, image, verified, created_at, resume_url
            FROM public.candidates
            ON CONFLICT (id) DO NOTHING;
        ELSE
            INSERT INTO public.talentos (id, name, location, area, status, role, summary, skills, image, verified, created_at)
            SELECT 
                id, name, location, area, 
                CASE WHEN status = 'approved' THEN 'active' ELSE status END, 
                role, summary, skills, image, verified, created_at
            FROM public.candidates
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- ==========================================
-- 4. PADRONIZAÇÃO DE STATUS (OPCIONAL)
-- ==========================================

UPDATE public.vagas SET status = 'active' WHERE status = 'approved';
UPDATE public.talentos SET status = 'active' WHERE status = 'approved';
UPDATE public.negocios SET status = 'active' WHERE status = 'approved';
UPDATE public.noticias SET status = 'active' WHERE status = 'approved';

-- ==========================================
-- 5. SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. PERMISSÕES (GRANTS) - NOVO PADRÃO SUPABASE
-- ==========================================
-- A partir de Maio/2026, o Supabase exige permissões explícitas para acessar tabelas via API.
-- Execute estes comandos para garantir que o site e o admin consigam ler/escrever dados.

-- Permissões para Tabelas Públicas (Leitura e Inserção Básica)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.vagas, public.talentos, public.negocios, public.contatos, public.history, public.testimonials TO anon, authenticated;

-- Permissões para Admin (Controle Total)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- ==========================================
-- 7. COMO ACESSAR O PAINEL ADMIN
-- ==========================================
-- 1. Vá em seu projeto no Supabase > Authentication > Users.
-- 2. Clique em "Add User" > "Create new user".
-- 3. Cadastre seu e-mail e uma senha forte.
-- 4. Acesse seu-site.com/admin/login e use esses dados.

-- ==========================================
-- 8. LIMPEZA (SÓ APAGUE DEPOIS DE CONFERIR TUDO)
-- ==========================================
-- DROP TABLE public.jobs;
-- DROP TABLE public.candidates;

-- ==========================================
-- 7. CORREÇÃO RÁPIDA (CASO JÁ TENHA AS TABELAS)
-- ==========================================
-- Se você já criou as tabelas e está tendo erro de "column not found" no cadastro,
-- execute este bloco de SQL no seu SQL Editor do Supabase:

/*
-- Adicionar colunas faltantes na tabela de Negócios
ALTER TABLE public.negocios ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.negocios ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.negocios ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.negocios ADD COLUMN IF NOT EXISTS verified boolean default false;

-- Adicionar coluna faltante na tabela de Vagas
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS logo_url text;

-- Adicionar colunas faltantes na tabela de Talentos
ALTER TABLE public.talentos ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.talentos ADD COLUMN IF NOT EXISTS phone text;

-- Adicionar coluna faltante na tabela de Notícias
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS attachment_url text;
*/
