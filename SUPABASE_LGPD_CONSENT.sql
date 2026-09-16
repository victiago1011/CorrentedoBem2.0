-- ==========================================
-- CONSENTIMENTO LGPD — TALENTOS E VAGAS
-- ==========================================
-- Execute este script no SQL Editor do Supabase ANTES do deploy
-- das alterações de cadastro.
--
-- Regras:
-- - Colunas nullable, sem DEFAULT
-- - NÃO preenche registros antigos
-- - NÃO cria cron, trigger ou exclusão automática
-- ==========================================

ALTER TABLE public.talentos
  ADD COLUMN IF NOT EXISTS terms_accepted boolean,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS privacy_consent boolean,
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS terms_accepted boolean,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;
