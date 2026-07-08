# Ambiente de Desenvolvimento

Versão: 1.0

Última atualização: 07/07/2026

Status: Oficial

---

# Objetivo

Este documento descreve o ambiente oficial de desenvolvimento do projeto Corrente do Bem.

Toda IA ou desenvolvedor deve utilizar este documento como referência antes de configurar o projeto local.

---

# Repositório Oficial

GitHub

https://github.com/victiago1011/CorrentedoBem2.0

Este é o repositório considerado fonte oficial do projeto.

---

# Site Oficial

Produção

https://www.correntedobembr.com.br

Deploy realizado através da Vercel.

---

# Fluxo da Infraestrutura

Registro.br
        ↓
Cloudflare (DNS)
        ↓
Vercel (Hospedagem)
        ↓
Next.js
        ↓
Supabase
        ↓
Resend
        ↓
Zoho Mail

---

# Tecnologias

Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS

Backend

- API Routes do Next.js

Banco

- Supabase PostgreSQL

Autenticação

- Supabase Auth

Hospedagem

- Vercel

Versionamento

- Git
- GitHub

Editor recomendado

- Cursor

---

# Variáveis de Ambiente

Arquivo utilizado durante o desenvolvimento:

.env.local

Arquivo de exemplo:

.env.example

As principais variáveis atualmente utilizadas são:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- RESEND_API_KEY
- GEMINI_API_KEY
- APP_URL

Nunca documentar valores reais das chaves.

---

# Ambiente Local

Requisitos

- Node.js 24 LTS
- npm
- Git
- Cursor

Instalação

npm install

Execução

npm run dev

Aplicação local

http://localhost:3000

---

# Deploy

Fluxo oficial

Desenvolvimento
        ↓
Git Commit
        ↓
GitHub
        ↓
Vercel
        ↓
Produção

Nenhuma alteração deve ser feita diretamente na produção.

Todo deploy deve partir do GitHub.

---

# Banco de Dados

Banco oficial

Supabase

Responsável por:

- Banco PostgreSQL
- Autenticação
- APIs

A estrutura completa encontra-se em:

docs/04_DATABASE.md

---

# E-mails

Serviço oficial

Resend

Responsável por:

- Newsletter
- Campanhas
- Contatos
- E-mails automáticos

---

# Correio Eletrônico

Serviço

Zoho Mail

Responsável pelos e-mails institucionais do domínio.

---

# DNS

Gerenciado através do Cloudflare.

O domínio principal é registrado no Registro.br.

---

# Boas práticas

Nunca alterar:

- .env.example
- .env.local
- Variáveis da Vercel
- Configurações do Supabase

sem aprovação explícita do responsável pelo projeto.

---

## Histórico

### v1.0

- Documento criado.

---

Este documento faz parte da documentação oficial do projeto Corrente do Bem.