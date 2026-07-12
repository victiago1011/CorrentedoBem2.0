-- ==========================================
-- email_campaigns — Etapa 1 (SQL repetível)
-- Escrita: somente service_role (API após auth admin)
-- Leitura: somente authenticated (SELECT)
-- anon: nenhum privilégio
-- Seguro para reexecução no SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  category text NOT NULL
    CHECK (category IN (
      'curriculos',
      'vagas',
      'noticias',
      'eventos',
      'institucional',
      'outros'
    )),
  html_content text NOT NULL,
  primary_button_text text,
  primary_button_link text,
  from_email text NOT NULL
    DEFAULT 'Corrente do Bem <contato@send.correntedobembr.com.br>',
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'sent', 'partial', 'failed')),
  recipients_count int NOT NULL DEFAULT 0,
  success_count int NOT NULL DEFAULT 0,
  failure_count int NOT NULL DEFAULT 0,
  invalid_count int NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT email_campaigns_counts_non_negative CHECK (
    recipients_count >= 0
    AND success_count >= 0
    AND failure_count >= 0
    AND invalid_count >= 0
  ),
  CONSTRAINT email_campaigns_button_pair_check CHECK (
    (
      primary_button_text IS NULL
      AND primary_button_link IS NULL
    )
    OR (
      primary_button_text IS NOT NULL
      AND btrim(primary_button_text) <> ''
      AND primary_button_link IS NOT NULL
      AND btrim(primary_button_link) <> ''
    )
  )
);

-- Se a tabela já existir de uma revisão anterior, garante a constraint do botão:
ALTER TABLE public.email_campaigns
  DROP CONSTRAINT IF EXISTS email_campaigns_button_pair_check;

ALTER TABLE public.email_campaigns
  ADD CONSTRAINT email_campaigns_button_pair_check CHECK (
    (
      primary_button_text IS NULL
      AND primary_button_link IS NULL
    )
    OR (
      primary_button_text IS NOT NULL
      AND btrim(primary_button_text) <> ''
      AND primary_button_link IS NOT NULL
      AND btrim(primary_button_link) <> ''
    )
  );

CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at
  ON public.email_campaigns (sent_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at
  ON public.email_campaigns (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_category
  ON public.email_campaigns (category);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status
  ON public.email_campaigns (status);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_campaigns_select_authenticated"
  ON public.email_campaigns;

DROP POLICY IF EXISTS "email_campaigns_insert_anon_authenticated"
  ON public.email_campaigns;

DROP POLICY IF EXISTS "email_campaigns_update_anon_authenticated"
  ON public.email_campaigns;

CREATE POLICY "email_campaigns_select_authenticated"
  ON public.email_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE ALL ON TABLE public.email_campaigns FROM anon;
REVOKE ALL ON TABLE public.email_campaigns FROM authenticated;

GRANT SELECT ON TABLE public.email_campaigns TO authenticated;
GRANT ALL ON TABLE public.email_campaigns TO service_role;
