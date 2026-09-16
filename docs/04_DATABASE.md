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

## Consentimento e publicação (Talentos e Vagas)

Script: `SUPABASE_LGPD_CONSENT.sql` (executar no SQL Editor do Supabase).

Colunas adicionadas em `talentos` (nullable, sem backfill):

- `terms_accepted`
- `terms_accepted_at`
- `terms_version` — versão dos Termos aceita pelo usuário (ex.: `2026-09-16`)
- `privacy_consent`
- `privacy_consent_at`
- `privacy_policy_version`
- `published_at` — preenchido na aprovação ou no cadastro direto pelo Admin
- `expires_at` — `published_at` + 90 dias (controle interno; **não há exclusão automática nesta versão**)

Colunas adicionadas em `vagas` (nullable, sem backfill):

- `terms_accepted`
- `terms_accepted_at`
- `terms_version`

Cadastros públicos novos gravam o aceite. Cadastros anteriores e cadastros feitos pelo Admin permanecem com esses campos `NULL`.

Não existe rotina de exclusão automática de Talentos no código. Foto e currículo continuam em Base64 nas colunas `image` e `cv_url` (sem Supabase Storage).

