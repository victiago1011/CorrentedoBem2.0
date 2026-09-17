# Banco de Dados — Corrente do Bem

Este documento descreve o banco de dados atual do projeto Corrente do Bem, baseado nos arquivos SQL existentes e no uso real do Supabase dentro da aplicação.

Não propõe melhorias. Apenas documenta o estado atual.

---

## Visão Geral

O projeto utiliza o **Supabase** como banco de dados e autenticação.

O banco é PostgreSQL, hospedado no Supabase, e é acessado pela aplicação através do cliente definido em:

```text
lib/supabase.ts
```

### Tabela legada: `contatos`

A tabela `contatos` permanece no banco por compatibilidade e preservação dos registros históricos, mas **não é mais utilizada pela aplicação** (não é lida nem alimentada pelo formulário de contato nem pelo painel administrativo).

---

## Consentimento e publicação

Versão jurídica: `2026-09-16` (`LEGAL_VERSION` em `lib/legal.ts`).

Módulos com consentimento registrado no cadastro público:

- Talentos
- Vagas (somente Termos)
- Negócios
- Depoimentos

Cadastros públicos novos passam por `POST /api/public/content`, que grava com `status = 'pending'` usando `service_role` no servidor. O visitante não faz INSERT direto no Data API.

### Fase 1 — Talentos e Vagas

Script: `SUPABASE_LGPD_CONSENT.sql`.

Colunas em `talentos` (nullable, sem backfill de consentimento):

- `terms_accepted`
- `terms_accepted_at`
- `terms_version`
- `privacy_consent`
- `privacy_consent_at`
- `privacy_policy_version`
- `published_at` — preenchido na aprovação ou no cadastro direto pelo Admin
- `expires_at` — `published_at` + 6 meses de calendário

Colunas em `vagas` (nullable, sem backfill):

- `terms_accepted`
- `terms_accepted_at`
- `terms_version`

As vagas **não** usam o prazo de 6 meses. Seguem a validade própria da plataforma.

### Fase 2 — Negócios, Depoimentos e correção do prazo dos Talentos

Script: `SUPABASE_LGPD_CONSENT_FASE2.sql` (executar no SQL Editor do Supabase **antes** do deploy da Fase 2).

Colunas em `negocios` (nullable, sem default, sem backfill):

- `terms_accepted`, `terms_accepted_at`, `terms_version`
- `privacy_consent`, `privacy_consent_at`, `privacy_policy_version`
- `published_at`, `expires_at` — preenchidos na aprovação ou no cadastro direto publicado pelo Admin; o cadastro público pendente **não** inicia o prazo

Colunas em `testimonials` (nullable, sem default, sem backfill):

- `terms_accepted`, `terms_accepted_at`, `terms_version`
- `privacy_consent`, `privacy_consent_at`, `privacy_policy_version`

Depoimentos **não** possuem `published_at`/`expires_at` nem expiração automática.

O mesmo script recalcula, somente para Talentos que já têm `published_at` e `expires_at` preenchidos:

`expires_at = published_at + interval '6 months'`

Não altera `published_at`, consentimento, status nem registros com janela NULL.

### Listagem pública (Talentos e Negócios)

Exibidos quando `status = 'active'` e (`expires_at IS NULL` ou `expires_at > now()`). Não há cron nem exclusão física. O Admin continua vendo o registro.

Não existe rotina automática nem varredura de órfãos. Foto, currículo, logo e anexos novos ficam no Supabase Storage: URL pública do bucket `public-media` ou path privado em `private-documents`. O legado Base64 dessas colunas foi migrado em 17/09/2026 (95 arquivos; ~39,86 MB decodificados; 0 arquivos válidos pendentes). Permanece uma exceção histórica: currículo HTML de 2113 bytes em Base64 em `talentos.cv_url`. URLs externas (ex.: Gravatar) continuam como referências fora do Storage.

Quando o Admin exclui um registro pelas telas do painel, `DELETE /api/admin/content` remove a linha no banco e, se o DELETE confirmar, tenta apagar apenas objetos reconhecidos do Storage daquele registro. Falha no Storage não desfaz a exclusão do banco.

