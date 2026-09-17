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
│  /api/storage/upload  /api/storage/signed-url                   │
│  /api/admin/content  /api/public/content                        │
│  Upload/cleanup/cadastro público usam lib/supabase-admin.ts     │
└─────────────────────────────────────────────────────────────────┘
```

### Características centrais

| Aspecto | Como funciona hoje |
|---|---|
| Renderização | Quase todas as páginas são **Client Components** (`'use client'`) |
| Busca de dados | Feita no **navegador**, via cliente Supabase |
| Autenticação admin | **Supabase Auth**, verificada no cliente (sem middleware Next.js) |
| E-mail | Enviado por **API Routes** que chamam a API HTTP do Resend |
| Arquivos (fotos, logos, CVs) | Novos envios usam **Supabase Storage** via `/api/storage/upload`. Imagens públicas em `public-media`; documentos privados em `private-documents`, lidos por signed URL. Base64 **não** é o armazenamento corrente. |
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
├── SUPABASE_LGPD_CONSENT.sql # Consentimento Fase 1 (talentos/vagas)
├── SUPABASE_LGPD_CONSENT_FASE2.sql # Consentimento Fase 2 + prazo de 6 meses
├── SUPABASE_NEWSLETTER.sql # Script SQL da tabela de newsletter
├── SUPABASE_ANALYTICS.sql  # Script SQL da tabela de analytics
├── scripts/                # Ferramentas one-off (ex.: auditoria de Base64 legado)
├── next.config.ts          # Configuração do Next.js
├── package.json            # Dependências
└── .env.example            # Referência de variáveis de ambiente
```

### `app/`

Contém **tudo** que o Next.js serve: páginas públicas, painel admin, rotas de API e os três componentes compartilhados. Não há subpastas de domínio (ex.: `services/`, `types/`, `features/`).

### `lib/`

| Arquivo | Responsabilidade |
|---|---|
| `legal.ts` | Versão jurídica, janela de publicação (6 meses) e filtro público de expiração |
| `supabase.ts` | Instancia e exporta o cliente Supabase anônimo (browser) |
| `supabase-admin.ts` | Cliente service_role — somente servidor (`server-only`) |
| `storage-config.ts` | Buckets, pastas, limites de seleção e categorias de upload |
| `storage-categories.ts` | Whitelist servidor/cliente: bucket, pasta, MIME e limites por categoria |
| `storage-upload.ts` | Upload via API Next.js, cleanup com deleteToken e signed URL no cliente |
| `storage-object-ref.ts` | Parser seguro de URL/path do Storage e extração de refs por entidade |
| `storage-cleanup.ts` | Remoção server-only de objetos já validados (`service_role`) |
| `admin-content-api.ts` | Cliente do Admin para DELETE/PATCH em `/api/admin/content` |
| `public-content.ts` | Whitelist e INSERT server-side dos cadastros públicos (`server-only`) |
| `public-content-api.ts` | Cliente dos formulários públicos para `POST /api/public/content` |
| `media-src.ts` | Resolução de mídia: URL pública, path privado e compatibilidade temporária de leitura Base64 |
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
- Talentos, Vagas, Negócios e Depoimentos têm aprovação/recusa. Aprovar mantém o registro e os arquivos. Recusar é exclusão definitiva pelo mesmo `DELETE /api/admin/content` da exclusão manual; não há reavaliação no painel.
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

O "backend" do projeto são as **API Routes** do Next.js em `app/api/`. Não existe servidor separado, framework de API dedicado ou camada de serviços.

```
app/api/
├── send-email/route.ts      POST — envia um e-mail via Resend
├── send-campaign/route.ts   POST — envia campanha de newsletter
├── unsubscribe/route.ts     GET  — descadastro/recadastro (retorna HTML)
├── track-visit/route.ts     POST — incrementa pageviews do dia
├── track-click/route.ts     GET  — registra clique e redireciona
├── storage/upload/route.ts  POST — upload server-side; DELETE — aborto com token
├── storage/signed-url/route.ts POST — URL temporária de documento privado
├── admin/content/route.ts   DELETE — exclusão de registro + cleanup; PATCH — notícia com nova imagem
└── public/content/route.ts  POST — cadastro público (Talentos, Vagas, Negócios, Depoimentos)
```

### Detalhe de cada rota

| Rota | Entrada | Saída | Integrações |
|---|---|---|---|
| `POST /api/send-email` | `{ to, subject, html, replyTo? }` | JSON `{ success, data }` | Resend API |
| `POST /api/send-campaign` | `{ subject, content, primaryButtonText?, primaryButtonLink?, testEmail? }` | JSON com contadores de envio | Supabase (`newsletter_subscribers`, `history`) + Resend API |
| `GET /api/unsubscribe` | Query: `id` ou `email`, opcional `resubscribe=true` | Página HTML | Supabase (`newsletter_subscribers`) |
| `POST /api/track-visit` | (sem body) | JSON `{ success }` | Supabase (`site_analytics`) |
| `GET /api/track-click` | Query: `id`, `url` | Redirect 302 | Supabase (`newsletter_subscribers`) |
| `POST /api/storage/upload` | `multipart`: `category`, `file` | JSON `{ bucket, path, publicUrl?, deleteToken? }` | Supabase Storage (service_role) |
| `DELETE /api/storage/upload` | `{ deleteToken }` | JSON `{ ok }` | Supabase Storage (service_role) |
| `POST /api/storage/signed-url` | `{ kind, recordId, index }` | JSON `{ url, expiresIn }` | PostgreSQL + Storage signed URL |
| `DELETE /api/admin/content` | `{ type, id }` | JSON `{ deleted, cleanup }` | PostgreSQL + Storage (`service_role`) |
| `PATCH /api/admin/content` | `{ type: 'noticia', id, title, content, excerpt, image_url, author, category }` | JSON `{ updated, cleanup, record }` | PostgreSQL + Storage (`service_role`) |
| `POST /api/public/content` | `{ type, data }` (`talento` \| `vaga` \| `negocio` \| `depoimento`) | JSON `{ ok }` | PostgreSQL (`service_role`) |

### Quem chama as API Routes

| Chamador | Rotas usadas |
|---|---|
| Formulários de cadastro (`/vagas/cadastrar`, `/talentos/cadastrar`, etc.) | `/api/public/content`, `/api/notify-admin`, `/api/storage/upload` |
| `app/contato/page.tsx` | `/api/notify-admin` |
| `app/admin/page.tsx` (moderação: aprovação e recusa) | `/api/send-email` |
| `app/admin/page.tsx` (notícias, talentos, negócios) | `/api/storage/upload` |
| `app/admin/page.tsx` (exclusão, recusa e troca de imagem de notícia) | `/api/admin/content` |
| Listagens públicas e admin (anexos privados) | `/api/storage/signed-url` |
| `app/admin/emails/page.tsx` | `/api/send-campaign` |
| `app/components/AnalyticsTracker.tsx` | `/api/track-visit` |
| Links em campanhas de e-mail | `/api/track-click`, `/api/unsubscribe` |

Parte das API Routes públicas (tracking, unsubscribe, notify-admin, `/api/public/content`) **não exige login**. Rotas administrativas (`/api/send-email`, `/api/send-campaign`, `/api/newsletter-subscribers/search`, `/api/admin/content` e upload `news-image`) validam sessão via `requireAdmin`.

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

- Cliente **anon** em `lib/supabase.ts` — navegador e rotas que não precisam de `service_role`
- Cliente **service_role** em `lib/supabase-admin.ts` — somente servidor (`server-only`), usado em upload, signed URL, `/api/admin/content` e `/api/public/content`

### Tabelas utilizadas pela aplicação

| Tabela | Operações no código |
|---|---|
| `vagas` | SELECT (público), INSERT via `/api/public/content` e Admin, UPDATE/DELETE (admin) |
| `talentos` | SELECT (público), INSERT via `/api/public/content` e Admin, UPDATE/DELETE (admin) |
| `negocios` | SELECT (público), INSERT via `/api/public/content` e Admin, UPDATE/DELETE (admin) |
| `noticias` | SELECT (público), INSERT/UPDATE/DELETE (admin) |
| `testimonials` | SELECT (público), INSERT via `/api/public/content` e Admin, UPDATE/DELETE (admin) |
| `contatos` | Nenhuma operação no código (tabela legada no Supabase; não lida nem alimentada pela aplicação) |
| `settings` | SELECT/UPDATE (admin) |
| `history` | INSERT (admin, API), SELECT (admin) |
| `newsletter_subscribers` | SELECT/INSERT/UPDATE/DELETE (admin, API) |
| `site_analytics` | SELECT (admin), INSERT/UPDATE (API) |

### Onde o Supabase é chamado

| Contexto | Arquivos |
|---|---|
| Páginas públicas | `app/page.tsx`, `app/vagas/page.tsx`, `app/talentos/page.tsx`, `app/negocios/page.tsx`, `app/noticias/page.tsx`, `app/noticias/[slug]/page.tsx`, `app/depoimentos/page.tsx` |
| Formulários de cadastro | `app/vagas/cadastrar/page.tsx`, `app/talentos/cadastrar/page.tsx`, `app/negocios/cadastrar/page.tsx`, `app/depoimentos/novo/page.tsx` (INSERT via `/api/public/content`; listagens públicas continuam no cliente) |
| Admin | `app/admin/page.tsx`, `app/admin/emails/page.tsx`, `app/admin/login/page.tsx` |
| API Routes | `app/api/send-campaign/route.ts`, `app/api/unsubscribe/route.ts`, `app/api/track-visit/route.ts`, `app/api/track-click/route.ts`, `app/api/storage/upload/route.ts`, `app/api/storage/signed-url/route.ts`, `app/api/admin/content/route.ts`, `app/api/public/content/route.ts` |

### Armazenamento de arquivos

Novos envios usam **Supabase Storage** via `/api/storage/upload`:

- imagens e logos públicos no bucket `public-media`;
- documentos privados (currículos e anexos) no bucket `private-documents`;
- documentos privados são lidos por signed URL em `/api/storage/signed-url` (120 segundos), após conferir o registro no banco.

O ciclo de vida administrativo remove objetos **próprios** do Storage: `DELETE /api/admin/content` (exclusão e Recusar) apaga a linha no banco e, só então, tenta `storage.remove` nos paths reconhecidos daquele registro. Na substituição de mídia (ex.: nova imagem de notícia em `PATCH /api/admin/content`), o objeto anterior só é removido depois do UPDATE confirmado. Base64 residual, Gravatar e URLs que não sejam do nosso Storage não são enviados a `storage.remove`. Não há varredura de órfãos. Falha parcial do cleanup não restaura o registro.

O legado Base64 nas colunas de mídia foi migrado em **17/09/2026**: 95 arquivos históricos passaram ao Storage (~39,86 MB de conteúdo decodificado). A migração encerrou com 0 arquivos válidos pendentes. Permanece **uma** exceção histórica conhecida: um currículo HTML de 2113 bytes gravado como `application/msword` em Base64 (`talentos.cv_url`). Essa exceção não deve ser migrada nem aceita como upload novo; a assinatura de arquivo (`file-signature`) não deve ser afrouxada para HTML.

A leitura de Base64 em `lib/media-src.ts` pode permanecer temporariamente para essa exceção e para qualquer residual. Isso **não** significa que Base64 seja o armazenamento corrente.

O script `scripts/migrate-base64-to-storage.ts` permanece versionado como registro técnico, auditoria/dry-run (padrão) e ferramenta idempotente. Escrita exige `--execute --confirm=MIGRATE_BASE64`. Relatórios e manifestos ficam fora do Git (`scripts/reports/`, `scripts/manifests/`).

No painel, **Recusar** Talento, Vaga, Negócio ou Depoimento usa essa mesma operação. Os dados do e-mail de recusa ficam em memória; o e-mail é enviado só depois do DELETE confirmado. Falha no e-mail não recria o cadastro. Cadastros antigos com `status = rejected` podem permanecer até exclusão manual. Não há recuperação de recusa no painel atual.

Quando o Admin troca a imagem de uma notícia, o UPDATE completo (texto + nova `image_url`) ocorre em `PATCH /api/admin/content`. Só após o UPDATE confirmado a imagem antiga válida é removida. Se o UPDATE falhar, o registro permanece e o arquivo novo usa o abort (`deleteToken`) já existente.

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
│  Moderação p/ publicação ─┘                                  │
│                               ▼                              │
│                    robinho@correntedobembr.com.br            │
│                    (ou e-mail do usuário, após publicação    │
│                     ou não publicação)                       │
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
- Sem roles ou permissões granulares — qualquer usuário autenticado no Supabase tem acesso total ao painel
- Algumas API Routes usam `requireAdmin` (Bearer + `getUser`); outras permanecem públicas
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
POST /api/storage/upload (se houver arquivo)
        │
        ▼
POST /api/public/content → INSERT server-side (status: 'pending')
        │
        ▼
POST /api/notify-admin → notifica admin
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
