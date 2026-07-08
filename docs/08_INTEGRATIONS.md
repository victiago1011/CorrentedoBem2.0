# Integrações Externas

Versão: 1.0

Última atualização: 07/07/2026

Status: Oficial

---

# Objetivo

Este documento descreve todas as integrações externas utilizadas pela plataforma Corrente do Bem.

Qualquer alteração em integrações deve consultar este documento antes de iniciar o desenvolvimento.

---

# Visão Geral

O projeto atualmente utiliza as seguintes integrações:

| Serviço | Finalidade |
|---|---|
| GitHub | Versionamento do código |
| Vercel | Deploy e hospedagem |
| Supabase | Banco de dados e autenticação |
| Resend | Envio de e-mails |
| Zoho Mail | Correio eletrônico institucional |
| Cloudflare | Gerenciamento de DNS |
| Registro.br | Registro do domínio |

---

# GitHub

Repositório oficial:

```text
https://github.com/victiago1011/CorrentedoBem2.0
```

Responsável por:

- controle de versões
- histórico do projeto
- integração contínua com a Vercel

Fluxo oficial:

```
Desenvolvimento
↓
Commit
↓
GitHub
↓
Vercel
```

---

# Vercel

Responsável por:

- hospedagem
- deploy automático
- ambiente de produção

Site oficial:

```text
https://www.correntedobembr.com.br
```

O deploy deve ocorrer exclusivamente através do GitHub.

Nunca alterar arquivos diretamente em produção.

---

# Supabase

Responsável por:

- Banco PostgreSQL
- Supabase Auth
- APIs do banco

Documentação relacionada:

```
docs/04_DATABASE.md
```

Variáveis utilizadas:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

# Resend

Responsável pelo envio de:

- newsletter
- campanhas
- e-mails automáticos
- notificações administrativas

Variável:

```
RESEND_API_KEY
```

As chamadas são realizadas através das rotas:

```
/api/send-email

/api/send-campaign
```

---

# Zoho Mail

Responsável pelos e-mails institucionais do domínio.

Exemplos:

- contato
- administração
- caixas postais

Não realiza envio automático das campanhas.

---

# Cloudflare

Responsável pelo gerenciamento de DNS.

Fluxo atual:

```
Registro.br
↓
Cloudflare
↓
Vercel
```

Funções:

- DNS
- SSL
- proxy
- segurança básica

---

# Registro.br

Responsável pelo registro oficial do domínio:

```
correntedobembr.com.br
```

Toda alteração de nameserver deve ser planejada.

---

# Fluxo Geral das Integrações

```
Usuário

↓

Site (Next.js)

↓

Supabase

↓

API Routes

↓

Resend

↓

Usuário
```

---

# Dependências

## Supabase

Depende de:

```
NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Resend

Depende de:

```
RESEND_API_KEY
```

---

## Vercel

Depende de:

- GitHub
- Variáveis de ambiente

---

## Cloudflare

Depende de:

- Registro.br

---

# Boas Práticas

Nunca alterar sem aprovação:

- DNS
- domínio
- integração Resend
- integração Supabase
- variáveis da Vercel
- autenticação
- webhooks futuros

---

# Futuras Integrações

Caso novas integrações sejam adicionadas (Google OAuth, WhatsApp, Mercado Pago, Stripe, OpenAI, etc.), este documento deverá ser atualizado.

---

## Histórico

### v1.0

Documento criado.

---

Este documento faz parte da documentação oficial do projeto Corrente do Bem.