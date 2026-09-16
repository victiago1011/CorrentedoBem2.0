# Painel Administrativo

Versão: 1.0

Última atualização: 07/07/2026

Status: Oficial

---

# Objetivo

Este documento descreve o funcionamento atual do painel administrativo da plataforma Corrente do Bem.

Ele deve ser usado como referência antes de qualquer alteração relacionada a moderação, gestão de conteúdo, newsletter ou administração do sistema.

---

# Rotas do Admin

O painel administrativo possui três rotas principais:

| Rota | Função |
|---|---|
| `/admin/login` | Tela de login do administrador |
| `/admin` | Painel principal de gestão e moderação |
| `/admin/emails` | Gestão de newsletter, campanhas e analytics |

---

# Autenticação

A autenticação utiliza Supabase Auth.

Fluxo atual:

```text
/admin/login
↓
supabase.auth.signInWithPassword()
↓
/admin

---

# Talentos

Na aprovação de um currículo, se `published_at` estiver vazio, o painel grava `published_at` e `expires_at` (90 dias). Isso é controle interno; a galeria pública continua usando apenas `status = active`.

No detalhe do currículo, o painel indica:

- Consentimento registrado (`privacy_consent = true`)
- Consentimento não registrado (`NULL`)

Cadastros criados pelo Admin não preenchem campos de aceite.
