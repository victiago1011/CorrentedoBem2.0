-- ==========================================
-- CONSENTIMENTO LGPD — NEGÓCIOS E DEPOIMENTOS
-- + PRAZO DE PUBLICAÇÃO (NEGÓCIOS)
-- + CORREÇÃO PONTUAL DO PRAZO DOS TALENTOS
-- ==========================================
-- Execute este script no SQL Editor do Supabase ANTES do deploy
-- das alterações de cadastro da Fase 2.
--
-- Regras:
-- - Novas colunas nullable, sem DEFAULT
-- - NÃO preenche consentimento de registros antigos
-- - NÃO cria janela de publicação onde published_at/expires_at são NULL
-- - NÃO cria cron, trigger ou exclusão automática
-- - NÃO altera colunas da Fase 1 em talentos/vagas (exceto o UPDATE pontual abaixo)
-- ==========================================

ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS terms_accepted boolean,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS privacy_consent boolean,
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS terms_accepted boolean,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS privacy_consent boolean,
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text;

-- Talentos que já possuem janela (Fase 1: +90 dias):
-- recalcula somente expires_at para published_at + 6 meses de calendário.
UPDATE public.talentos
SET expires_at = published_at + interval '6 months'
WHERE published_at IS NOT NULL
  AND expires_at IS NOT NULL;
