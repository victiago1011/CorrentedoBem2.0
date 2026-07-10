# Arquitetura Atual — Corrente do Bem

Este documento descreve **somente a arquitetura existente** no código do projeto, com base no estado atual do repositório. Não contém propostas de melhoria, refatoração ou redesenho.

---

## Arquitetura de alto nível

O projeto é uma aplicação web **monolítica** construída com **Next.js 15 (App Router)**. Toda a lógica de negócio, interface e integrações vivem em um único repositório.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Navegador do usuário                          │
│  ┌────────────────────┐       ┌─────────────────────────────┐   │
│  │   Site público     │       │   Painel administrativo      │   │
│  │   (páginas /app)   │       │   (/admin, /admin/emails)    │   │
│  └─────────┬──────────┘       └──────────────┬──────────────┘   │
│            │                                  │                  │
│            └──────────────┬───────────────────┘                  │
│                           │                                      │
│              Supabase JS Client (anon key)                       │
│              lib/supabase.ts — usado no browser                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │  Supabase   │   │  Supabase   │   │   Resend    │
  │  PostgreSQL │   │    Auth     │   │  (e-mail)   │
  └─────────────┘   └─────────────┘   └─────────────┘
         ▲
         │
┌────────┴────────────────────────────────────────────────────────┐
│              Next.js API Routes (servidor)                       │
│  /api/send-email  /api/send-campaign  /api/unsubscribe          │
│  /api/track-visit /api/track-click                              │
│  Também usam lib/supabase.ts e fetch para Resend                │
└─────────────────────────────────────────────────────────────────┘
```

### Características centrais

| Aspecto | Como funciona hoje |
|---|---|
| Renderização | Quase todas as páginas são **Client Components** (`'use client'`) |
| Busca de dados | Feita no **navegador**, via cliente Supabase |
| Autenticação admin | **Supabase Auth**, verificada no cliente (sem middleware Next.js) |
| E-mail | Enviado por **API Routes** que chamam a API HTTP do Resend |
| Arquivos (logos, CVs) | Salvos como **base64 em colunas de texto** no banco — sem Supabase Storage |
| Deploy | Build configurado como `output: 'standalone'` em `next.config.ts` |

---

## Pastas principais e responsabilidades

```
CorrentedoBem/
├── app/                    # Toda a aplicação Next.js (páginas, API, componentes)
├── lib/                    # Cliente Supabase e funções utilitárias
├── hooks/                  # Hooks React reutilizáveis
├── docs/                   # Documentação do projeto
├── SUPABASE_SETUP.md       # Script SQL das tabelas principais
├── SUPABASE_NEWSLETTER.sql # Script SQL da tabela de newsletter
├── SUPABASE_ANALYTICS.sql  # Script SQL da tabela de analytics
├── next.config.ts          # Configuração do Next.js
├── package.json            # Dependências
└── .env.example            # Referência de variáveis de ambiente
```

### `app/`

Contém **tudo** que o Next.js serve: páginas públicas, painel admin, rotas de API e os três componentes compartilhados. Não há subpastas de domínio (ex.: `services/`, `types/`, `features/`).

### `lib/`

| Arquivo | Responsabilidade |
|---|---|
| `supabase.ts` | Instancia e exporta o único cliente Supabase |
| `utils.ts` | Funções utilitárias: `cn`, `maskPhone`, `maskCurrency`, `ensureExternalLink`, `stripHtml` |

### `hooks/`

| Arquivo | Responsabilidade |
|---|---|
| `use-mobile.ts` | Detecta viewport mobile (breakpoint 768px) — definido, pouco usado no código atual |

### `docs/`

Documentação de referência para humanos e assistentes de IA.

### Raiz do projeto

Scripts SQL e arquivos de configuração. Os scripts SQL são executados **manualmente** no painel do Supabase — não fazem parte do build da aplicação.

---

## Estrutura do frontend

### Organização por rotas (App Router)

O Next.js App Router mapeia pastas em URLs. Cada pasta com `page.tsx` é uma rota.

```
app/
├── layout.tsx              # Layout raiz (fontes, AnalyticsTracker, metadata)
├── page.tsx                # Landing page (/)
├── globals.css             # Estilos globais e tema Tailwind
├── components/
│   ├── Navbar.tsx          # Menu de navegação
│   ├── Footer.tsx          # Rodapé
│   └── AnalyticsTracker.tsx # Rastreamento de visitas
├── vagas/
│   ├── page.tsx            # Listagem (/vagas)
│   └── cadastrar/page.tsx  # Formulário (/vagas/cadastrar)
├── talentos/
│   ├── page.tsx            # Listagem (/talentos)
│   └── cadastrar/page.tsx  # Formulário (/talentos/cadastrar)
├── negocios/
│   ├── page.tsx            # Listagem (/negocios)
│   └── cadastrar/page.tsx  # Formulário (/negocios/cadastrar)
├── noticias/
│   ├── page.tsx            # Listagem (/noticias)
│   └── [slug]/page.tsx     # Detalhe dinâmico (/noticias/:slug)
├── depoimentos/
│   ├── page.tsx            # Listagem (/depoimentos)
│   └── novo/page.tsx       # Formulário (/depoimentos/novo)
├── contato/page.tsx
├── privacidade/page.tsx
├── termos/page.tsx
└── admin/
    ├── layout.tsx          # Metadata do admin
    ├── login/page.tsx      # Login (/admin/login)
    ├── page.tsx            # Painel principal (/admin)
    └── emails/page.tsx     # Newsletter (/admin/emails)
```

### Padrão das páginas públicas

Todas seguem a mesma estrutura:

1. `'use client'` no topo do arquivo
2. Import de `Navbar` e `Footer` (exceto admin e unsubscribe)
3. `useEffect` para buscar dados do Supabase no mount
4. Estado local com `useState` para listas, filtros e modais
5. Formulários de cadastro inserem no Supabase com `status: 'pending'`
6. Após insert, chamam `/api/send-email` para notificar o admin

### Padrão do painel admin

- `app/admin/page.tsx` — arquivo único que concentra todas as views de moderação (vagas, talentos, negócios, notícias, depoimentos, configurações, histórico)
- `app/admin/emails/page.tsx` — gestão de inscritos, campanhas e analytics
- Navegação interna por estado (`activeView`) — não usa sub-rotas
- Editor rich text via `react-quill-new` (import dinâmico, sem SSR)

### Estilização

- **Tailwind CSS 4** com tema customizado em `globals.css` (`@theme`)
- Cores semânticas: `primary` (#00628c), `surface`, `on-surface`, etc.
- Fontes: Inter (corpo) e Plus Jakarta Sans (títulos), carregadas em `app/layout.tsx`
- Animações: biblioteca `motion` importada como `motion/react`
- Ícones: `lucide-react`

### Componentes compartilhados vs. código inline

Apenas **3 componentes** estão em `app/components/`. Vários helpers (ex.: `CandidateAvatar`, `parseAttachments`, `SafeImage`) estão **duplicados inline** dentro de páginas individuais — não foram extraídos para arquivos separados.

---

## Estrutura do backend / API

O "backend" do projeto são as **5 API Routes** do Next.js em `app/api/`. Não existe servidor separado, framework de API dedicado ou camada de serviços.

```
app/api/
├── send-email/route.ts      POST — envia um e-mail via Resend
├── send-campaign/route.ts   POST — envia campanha de newsletter
├── unsubscribe/route.ts     GET  — descadastro/recadastro (retorna HTML)
├── track-visit/route.ts     POST — incrementa pageviews do dia
└── track-click/route.ts     GET  — registra clique e redireciona
```

### Detalhe de cada rota

| Rota | Entrada | Saída | Integrações |
|---|---|---|---|
| `POST /api/send-email` | `{ to, subject, html, replyTo? }` | JSON `{ success, data }` | Resend API |
| `POST /api/send-campaign` | `{ subject, content, primaryButtonText?, primaryButtonLink?, testEmail? }` | JSON com contadores de envio | Supabase (`newsletter_subscribers`, `history`) + Resend API |
| `GET /api/unsubscribe` | Query: `id` ou `email`, opcional `resubscribe=true` | Página HTML | Supabase (`newsletter_subscribers`) |
| `POST /api/track-visit` | (sem body) | JSON `{ success }` | Supabase (`site_analytics`) |
| `GET /api/track-click` | Query: `id`, `url` | Redirect 302 | Supabase (`newsletter_subscribers`) |

### Quem chama as API Routes

| Chamador | Rotas usadas |
|---|---|
| Formulários de cadastro (`/vagas/cadastrar`, `/talentos/cadastrar`, etc.) | `/api/send-email` |
| `app/contato/page.tsx` | `/api/send-email` |
| `app/admin/page.tsx` (aprovações) | `/api/send-email` |
| `app/admin/emails/page.tsx` | `/api/send-campaign` |
| `app/components/AnalyticsTracker.tsx` | `/api/track-visit` |
| Links em campanhas de e-mail | `/api/track-click`, `/api/unsubscribe` |

As API Routes **não possuem autenticação própria** — qualquer cliente que conheça a URL pode chamá-las.

---

## Integração com Supabase

### Cliente

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

- **Um único cliente** com a chave anon (pública)
- Usado tanto no navegador (páginas) quanto no servidor (API Routes)
- Não existe cliente com `service_role` no código

### Tabelas utilizadas pela aplicação

| Tabela | Operações no código |
|---|---|
| `vagas` | SELECT (público), INSERT (cadastro), UPDATE/DELETE (admin) |
| `talentos` | SELECT (público), INSERT (cadastro), UPDATE/DELETE (admin) |
| `negocios` | SELECT (público), INSERT (cadastro), UPDATE/DELETE (admin) |
| `noticias` | SELECT (público), INSERT/UPDATE/DELETE (admin) |
| `testimonials` | SELECT (público), INSERT (cadastro), UPDATE/DELETE (admin) |
| `contatos` | Nenhuma operação no código (tabela legada no Supabase; não lida nem alimentada pela aplicação) |
| `settings` | SELECT/UPDATE (admin) |
| `history` | INSERT (admin, API), SELECT (admin) |
| `newsletter_subscribers` | SELECT/INSERT/UPDATE/DELETE (admin, API) |
| `site_analytics` | SELECT (admin), INSERT/UPDATE (API) |

### Onde o Supabase é chamado

| Contexto | Arquivos |
|---|---|
| Páginas públicas | `app/page.tsx`, `app/vagas/page.tsx`, `app/talentos/page.tsx`, `app/negocios/page.tsx`, `app/noticias/page.tsx`, `app/noticias/[slug]/page.tsx`, `app/depoimentos/page.tsx` |
| Formulários de cadastro | `app/vagas/cadastrar/page.tsx`, `app/talentos/cadastrar/page.tsx`, `app/negocios/cadastrar/page.tsx`, `app/depoimentos/novo/page.tsx` |
| Admin | `app/admin/page.tsx`, `app/admin/emails/page.tsx`, `app/admin/login/page.tsx` |
| API Routes | `app/api/send-campaign/route.ts`, `app/api/unsubscribe/route.ts`, `app/api/track-visit/route.ts`, `app/api/track-click/route.ts` |

### Armazenamento de arquivos

O projeto **não usa Supabase Storage**. Arquivos enviados pelos formulários (logos, fotos, CVs, anexos) são convertidos para **base64 data URL** no navegador via `FileReader` e salvos diretamente em colunas de texto (`logo_url`, `image`, `cv_url`, `attachment_url`, `photo_url`).

### Segurança no banco (RLS)

Row Level Security está habilitado nas tabelas (definido nos scripts SQL). As políticas atuais permitem operações amplas para roles `anon` e `authenticated`. A segurança do admin depende da autenticação Supabase no cliente, não de políticas restritivas no banco.

---

## Integração com Resend

### Como o Resend é chamado

O projeto **não usa o SDK npm do Resend**. Todas as chamadas são `fetch` direto para a API REST:

- `POST https://api.resend.com/emails` — envio individual
- `POST https://api.resend.com/emails/batch` — envio em lote (campanhas)

Autenticação via header: `Authorization: Bearer ${RESEND_API_KEY}`

### Remetente

Todas as mensagens saem de: `Corrente do Bem <contato@send.correntedobembr.com.br>`

No formulário de contato, o e-mail do visitante é enviado como **Reply-To** (`replyTo` → `reply_to` na API do Resend).

### Fluxos de e-mail

```
┌──────────────────────────────────────────────────────────────┐
│                    E-mails transacionais                      │
│                                                              │
│  Cadastro público ──┐                                        │
│  Formulário contato ├──→ POST /api/send-email ──→ Resend    │
│  Admin (aprovação) ─┘         │                              │
│                               ▼                              │
│                    robinho@correntedobembr.com.br            │
│                    (ou e-mail do usuário, em aprovações)     │
│                                                              │
│  Contato: Reply-To = e-mail do visitante;                    │
│  sucesso na UI só se o Resend confirmar o envio;             │
│  mensagem não é salva no banco.                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Campanhas de newsletter                    │
│                                                              │
│  Admin (/admin/emails)                                       │
│       │                                                      │
│       ▼                                                      │
│  POST /api/send-campaign                                     │
│       │                                                      │
│       ├── teste: 1 e-mail via /emails                        │
│       │                                                      │
│       └── campanha: busca newsletter_subscribers (ativo=true)│
│                     envia em lotes de 100 via /emails/batch  │
│                     registra em history                      │
│                                                              │
│  Template HTML com:                                            │
│    - {{nome}} e {{email}} personalizados                     │
│    - Botão CTA com link via /api/track-click                 │
│    - Link de descadastro via /api/unsubscribe                │
└──────────────────────────────────────────────────────────────┘
```

---

## Fluxo de autenticação

O projeto usa **Supabase Auth** exclusivamente para o painel administrativo. Visitantes do site público **não precisam de login**.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  /admin/    │     │  Supabase Auth   │     │  /admin         │
│  login      │────→│  signInWith      │────→│  (painel)       │
│             │     │  Password        │     │                 │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │
                           ▼
                    Sessão JWT armazenada
                    pelo cliente Supabase
                    no navegador
```

### Passos do fluxo

1. Admin acessa `/admin/login`
2. Preenche e-mail e senha
3. `supabase.auth.signInWithPassword()` é chamado
4. Se sucesso, redireciona para `/admin`
5. Em `/admin` e `/admin/emails`, um `useEffect` chama `supabase.auth.getSession()`
6. Se não há sessão, redireciona de volta para `/admin/login`
7. Logout via `supabase.auth.signOut()` → redireciona para `/admin/login`

### O que o fluxo **não** possui

- Sem **Next.js middleware** protegendo rotas `/admin/*`
- Sem verificação de sessão nas **API Routes**
- Sem roles ou permissões granulares — qualquer usuário autenticado no Supabase tem acesso total ao painel
- Usuários admin são criados **manualmente** no painel do Supabase (Authentication → Users)

---

## Módulos principais da aplicação

| Módulo | Rotas | Responsabilidade |
|---|---|---|
| **Landing** | `/` | Página inicial com destaques, busca e seções informativas |
| **Vagas** | `/vagas`, `/vagas/cadastrar` | Listagem filtrada e cadastro público de vagas |
| **Talentos** | `/talentos`, `/talentos/cadastrar` | Galeria de currículos e cadastro de perfil |
| **Negócios** | `/negocios`, `/negocios/cadastrar` | Listagem e cadastro de oportunidades de negócio |
| **Notícias** | `/noticias`, `/noticias/[slug]` | Listagem e leitura de artigos |
| **Depoimentos** | `/depoimentos`, `/depoimentos/novo` | Exibição e envio de depoimentos |
| **Contato** | `/contato` | Formulário que envia e-mail via Resend (sem persistência; sem view no admin) |
| **Institucional** | `/privacidade`, `/termos` | Páginas estáticas de política e termos |
| **Admin — Moderação** | `/admin` | Aprovação, edição e exclusão de todo conteúdo |
| **Admin — Newsletter** | `/admin/emails` | Gestão de inscritos, campanhas e analytics |
| **Admin — Login** | `/admin/login` | Autenticação |
| **Analytics** | `AnalyticsTracker` + `/api/track-visit` | Contagem de pageviews diários |
| **E-mail** | `/api/send-email`, `/api/send-campaign` | Envio transacional e campanhas |

---

## Fluxo de dados entre módulos

### Fluxo 1 — Cadastro público

```
Usuário preenche formulário
        │
        ▼
INSERT no Supabase (status: 'pending')
        │
        ▼
POST /api/send-email → notifica admin
        │
        ▼
Admin vê item em /admin (aba Pendentes)
        │
        ├── Aprovar → UPDATE status para 'active' ou 'approved'
        │              → POST /api/send-email (notifica usuário)
        │              → INSERT em history
        │
        └── Rejeitar → UPDATE status para 'rejected'
                       → INSERT em history
```

### Fluxo 2 — Formulário de contato

```
Visitante preenche /contato
        │
        ▼
Validação dos dados no cliente
        │
        ▼
POST /api/send-email
  to: robinho@correntedobembr.com.br
  replyTo: e-mail do visitante
  from: contato@send.correntedobembr.com.br
        │
        ├── Resend OK → formulário exibe sucesso
        │
        └── Falha → mensagem amigável; visitante pode tentar de novo

(Não há INSERT em contatos. Não há view "Mensagens de Contato" no painel.)
```

### Fluxo 3 — Exibição pública

```
Página pública carrega (useEffect)
        │
        ▼
SELECT no Supabase WHERE status = 'active' (ou 'approved' para depoimentos)
        │
        ▼
Dados renderizados no navegador (filtros e paginação no cliente)
```

### Fluxo 4 — Campanha de newsletter

```
Admin compõe campanha em /admin/emails
        │
        ▼
POST /api/send-campaign
        │
        ├── Modo teste: envia 1 e-mail
        │
        └── Modo campanha:
              SELECT newsletter_subscribers WHERE ativo = true
              → Gera HTML personalizado por inscrito
              → Envia em lotes de 100 via Resend batch
              → INSERT em history com resultado
```

### Fluxo 5 — Rastreamento

```
Visitante navega no site
        │
        ▼
AnalyticsTracker detecta mudança de rota
        │
        ▼
POST /api/track-visit
        │
        ▼
UPSERT em site_analytics (incrementa pageviews_count do dia)

---

Inscrito clica link em campanha de e-mail
        │
        ▼
GET /api/track-click?id=...&url=...
        │
        ├── UPDATE newsletter_subscribers (cliques_count, ultimo_clique)
        │
        └── Redirect 302 para URL de destino
```

### Fluxo 6 — Descadastro

```
Inscrito clica "Descadastrar" no e-mail
        │
        ▼
GET /api/unsubscribe?id=...
        │
        ▼
UPDATE newsletter_subscribers SET ativo = false
        │
        ▼
Retorna página HTML de confirmação
```

---

## Diagrama de dependências entre camadas

```
┌─────────────────────────────────────────────────┐
│                  Camada UI                       │
│  Páginas (app/**/*.tsx)                         │
│  Componentes (Navbar, Footer, AnalyticsTracker) │
│  Estilos (globals.css, Tailwind)                │
└────────────────────┬────────────────────────────┘
                     │ importa
                     ▼
┌─────────────────────────────────────────────────┐
│              Camada de utilitários               │
│  lib/supabase.ts  ·  lib/utils.ts               │
│  hooks/use-mobile.ts                            │
└────────┬───────────────────────┬────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐   ┌─────────────────────────┐
│  Supabase       │   │  API Routes (servidor)   │
│  (DB + Auth)    │   │  app/api/**/route.ts     │
└─────────────────┘   └───────────┬─────────────┘
                                  │
                                  ▼
                      ┌─────────────────────┐
                      │  Resend (e-mail)    │
                      └─────────────────────┘
```

---

## Referências

- Visão geral do produto: [01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md)
- Regras para assistentes de IA: [02_AI_CONTEXT.md](./02_AI_CONTEXT.md)
- Ponto de entrada da documentação: [00_START_HERE.md](./00_START_HERE.md)
