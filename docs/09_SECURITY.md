# Segurança

Versão: 1.0

Última atualização: 07/07/2026

Status: Oficial

---

# Objetivo

Este documento descreve as práticas de segurança atualmente utilizadas no projeto Corrente do Bem.

Também define quais áreas são consideradas críticas e exigem maior cuidado durante qualquer alteração.

---

# Áreas Sensíveis

As seguintes áreas são consideradas críticas:

- Autenticação
- Banco de Dados
- API Routes
- Variáveis de Ambiente
- Painel Administrativo
- Integrações Externas
- Deploy

Qualquer alteração nestas áreas deve ser planejada antes da implementação.

---

# Autenticação

A autenticação do painel administrativo utiliza:

Supabase Auth

Fluxo:

```
Login
↓

Supabase Auth

↓

Sessão

↓

Painel Administrativo
```

O código utiliza:

```
supabase.auth.signInWithPassword()

supabase.auth.getSession()

supabase.auth.signOut()
```

---

# Variáveis de Ambiente

Nunca expor:

```
RESEND_API_KEY

Service Role Key

Tokens

Segredos

Credenciais
```

As variáveis reais nunca devem ser gravadas em:

- GitHub
- README
- documentação
- exemplos
- código

---

# Banco de Dados

Nunca alterar:

- estrutura das tabelas
- políticas RLS
- autenticação
- permissões

sem planejamento.

Toda alteração estrutural deve ser documentada.

---

# API Routes

Atualmente existem:

```
/api/send-email

/api/send-campaign

/api/unsubscribe

/api/track-click

/api/track-visit
```

Antes de alterar qualquer rota verificar:

- impacto
- autenticação
- banco
- segurança
- logs

---

# Painel Administrativo

Toda funcionalidade administrativa deve:

- validar autenticação
- registrar histórico quando necessário
- respeitar os fluxos de aprovação

---

# E-mails

Nunca expor:

- API Keys
- destinatários internos
- credenciais

O envio deve continuar centralizado nas API Routes.

---

# GitHub

Nunca enviar para o repositório:

```
.env.local

credenciais

tokens

backups

arquivos sensíveis
```

---

# Deploy

O deploy oficial deve ocorrer:

```
GitHub

↓

Vercel

↓

Produção
```

Nunca alterar produção manualmente.

---

# Cloudflare

Alterações em:

- DNS
- SSL
- Proxy

devem ser planejadas.

---

# Registro.br

Alterações de:

- domínio
- nameservers

devem ser registradas na documentação.

---

# Supabase

Nunca alterar:

- tabelas
- RLS
- autenticação
- usuários administrativos

sem aprovação.

---

# Resend

Nunca alterar:

- domínio de envio
- API Key

sem aprovação.

---

# Zoho

Nunca alterar:

- caixas postais
- DNS de e-mail

sem planejamento.

---

# Checklist antes de qualquer alteração

Antes de implementar qualquer funcionalidade verificar:

☐ Afeta autenticação?

☐ Afeta banco?

☐ Afeta API?

☐ Afeta deploy?

☐ Afeta variáveis?

☐ Afeta segurança?

☐ Precisa atualizar documentação?

---

# Histórico

## v1.0

Documento criado.

---

Este documento faz parte da documentação oficial do projeto Corrente do Bem.