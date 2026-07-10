# Corrente do Bem — Visão Geral do Projeto

## O que é a Corrente do Bem

A **Corrente do Bem** é uma plataforma web de impacto social que conecta pessoas, oportunidades e negócios com propósito. O site funciona como um ecossistema de divulgação e conexão, reunindo em um só lugar:

- **Vagas de emprego**
- **Currículos e perfis de talentos**
- **Oportunidades de negócios**
- **Notícias**
- **Depoimentos**
- **Formulário de contato**
- **Newsletter e campanhas por e-mail**

O projeto nasceu como um aplicativo no **Google AI Studio** e evoluiu para um site em produção, hospedado em `correntedobembr.com.br`.

---

## Propósito do Projeto

Facilitar a **recolocação profissional** e a **conexão entre pessoas** de forma humana, respeitosa e com impacto social.

A plataforma não é um marketplace automatizado: ela funciona com **moderação humana**. Cadastros públicos entram com status `pending` e só aparecem no site após aprovação no painel administrativo.

Em resumo, o projeto existe para:

1. Divulgar oportunidades reais de trabalho e negócios
2. Dar visibilidade a talentos que buscam recolocação
3. Compartilhar notícias e histórias da rede
4. Manter uma comunidade ativa via contato e newsletter

---

## Público-Alvo

| Perfil | O que faz na plataforma |
|---|---|
| **Candidatos / talentos** | Cadastram currículo e perfil profissional |
| **Empresas / recrutadores** | Publicam vagas de emprego |
| **Empreendedores** | Divulgam oportunidades de negócio |
| **Visitantes** | Consultam vagas, talentos, notícias e depoimentos |
| **Comunidade** | Envia mensagens pelo formulário de contato |
| **Inscritos da newsletter** | Recebem campanhas e comunicações por e-mail |
| **Administradores** | Moderam cadastros, publicam notícias e gerenciam a plataforma |

O projeto é descrito como **voluntário** — a equipe responde mensagens e revisa cadastros manualmente.

---

## Módulos Principais

### 1. Site Público

Páginas acessíveis a qualquer visitante:

| Rota | Função |
|---|---|
| `/` | Página inicial com destaques de vagas, talentos e depoimentos |
| `/vagas` | Listagem de vagas com filtros e busca |
| `/vagas/cadastrar` | Formulário público para cadastrar vaga |
| `/talentos` | Galeria de currículos e perfis |
| `/talentos/cadastrar` | Formulário público para cadastrar talento |
| `/negocios` | Listagem de oportunidades de negócio |
| `/negocios/cadastrar` | Formulário público para cadastrar negócio |
| `/noticias` | Listagem de notícias |
| `/noticias/[slug]` | Página individual de cada notícia |
| `/depoimentos` | Depoimentos aprovados |
| `/depoimentos/novo` | Envio de novo depoimento |
| `/contato` | Formulário de contato |
| `/privacidade` | Política de privacidade |
| `/termos` | Termos de uso |

### 2. Cadastros Públicos

Formulários onde qualquer pessoa pode enviar conteúdo. Todos seguem o mesmo fluxo:

1. Usuário preenche o formulário
2. Dados são salvos no Supabase com `status: pending`
3. Um e-mail de notificação é enviado ao administrador
4. Admin aprova ou rejeita no painel

### 3. Painel Administrativo

Área restrita para moderadores:

| Rota | Função |
|---|---|
| `/admin/login` | Login com e-mail e senha (Supabase Auth) |
| `/admin` | Painel principal de moderação e gestão |
| `/admin/emails` | Gestão de newsletter, campanhas e analytics |

O painel `/admin` concentra a gestão de:

- Vagas (aprovar, rejeitar, editar, excluir)
- Currículos / talentos
- Negócios
- Notícias (criação com editor rich text)
- Depoimentos
- Configurações da plataforma
- Histórico de ações administrativas

Mensagens do formulário de contato **não** aparecem no painel: são enviadas por e-mail via Resend.

### 4. API Interna (rotas do servidor)

| Rota | Função |
|---|---|
| `/api/send-email` | Envia um e-mail transacional via Resend |
| `/api/send-campaign` | Envia campanha de newsletter (teste ou em massa) |
| `/api/unsubscribe` | Descadastro / recadastro de inscritos |
| `/api/track-visit` | Registra visualizações diárias do site |
| `/api/track-click` | Rastreia cliques em links de campanhas |

### 5. Componentes Compartilhados

Apenas três componentes reutilizáveis formais existem hoje:

- `Navbar` — menu de navegação e modal de cadastro
- `Footer` — rodapé do site
- `AnalyticsTracker` — rastreamento de visitas por rota

---

## Stack Atual

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Linguagem | **TypeScript** |
| Interface | **React 18**, **Tailwind CSS 4** |
| Animações | **Motion** (`motion/react`) |
| Ícones | **Lucide React** |
| Editor de texto | **react-quill-new** |
| Markdown | **react-markdown** |
| Recorte de imagem | **react-easy-crop** |
| Banco de dados e autenticação | **Supabase** |
| E-mail | **Resend** (via API HTTP, sem SDK) |
| Deploy | Build `standalone` (compatível com Cloud Run / containers) |

### Estrutura de pastas (resumo)

```
app/           → páginas, componentes e rotas de API
lib/           → cliente Supabase e utilitários
hooks/         → hooks React (ex.: use-mobile, ainda pouco usado)
docs/          → documentação do projeto (este arquivo)
```

---

## Serviços Externos

### Supabase

Usado para:

- **Banco de dados PostgreSQL** — todas as tabelas de conteúdo
- **Autenticação** — login do painel admin
- **RLS (Row Level Security)** — políticas de acesso às tabelas

Variáveis necessárias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Scripts SQL de configuração (executados manualmente no painel Supabase):

- `SUPABASE_SETUP.md` — tabelas principais
- `SUPABASE_NEWSLETTER.sql` — tabela de inscritos
- `SUPABASE_ANALYTICS.sql` — tabela de analytics

### Resend

Usado para:

- Notificações ao admin (novo cadastro)
- Mensagens do formulário de contato (envio direto por e-mail, sem gravação no banco)
- E-mails de aprovação/rejeição para usuários
- Campanhas de newsletter em massa

Variável necessária:

- `RESEND_API_KEY` (somente servidor, não exposta ao navegador)

Remetente configurado: `Corrente do Bem <contato@send.correntedobembr.com.br>`

#### Formulário de contato (`/contato`)

1. O visitante preenche e o sistema valida os dados.
2. A mensagem é enviada via `POST /api/send-email` (Resend) para `robinho@correntedobembr.com.br`.
3. O e-mail do visitante é usado como **Reply-To**.
4. O formulário só exibe sucesso se o Resend confirmar o envio; em falha, mostra mensagem amigável e permite nova tentativa.
5. A mensagem **não** é salva no banco de dados.

---

## Banco de Dados (resumo)

| Tabela | Conteúdo |
|---|---|
| `vagas` | Vagas de emprego |
| `talentos` | Perfis e currículos |
| `negocios` | Oportunidades de negócio |
| `noticias` | Artigos e notícias |
| `testimonials` | Depoimentos |
| `contatos` | Legada — permanece no banco por compatibilidade e registros históricos; **não** é mais usada pela aplicação |
| `settings` | Configurações da plataforma (registro único) |
| `history` | Log de ações do admin |
| `newsletter_subscribers` | Inscritos da newsletter |
| `site_analytics` | Contagem diária de visitas |

### Fluxo de status

- Vagas, talentos, negócios e notícias: `pending` → `active` ou `rejected`
- Depoimentos: `pending` → `approved` ou `rejected`

---

## Status Atual do Desenvolvimento

### O que já funciona

- Site público completo com todas as páginas listadas
- Cadastros públicos com notificação por e-mail
- Painel admin com moderação de todos os tipos de conteúdo
- Newsletter com envio de campanhas e rastreamento de cliques
- Analytics básico de visitas diárias
- Autenticação de admin via Supabase

### Limitações e dívidas técnicas conhecidas

Estas são situações reais do código hoje — não são bugs urgentes, mas devem ser consideradas em qualquer mudança futura:

| Área | Situação atual |
|---|---|
| **Admin** | Arquivo `app/admin/page.tsx` muito grande (~5.300 linhas) |
| **Segurança** | Rotas de API de e-mail sem autenticação |
| **RLS** | Políticas muito permissivas em algumas tabelas |
| **Arquivos** | Logos e anexos salvos como base64 no banco (não usa Supabase Storage) |
| **Componentes** | Muita lógica duplicada entre páginas (helpers repetidos) |
| **Status** | Valores `approved` e `active` usados de forma inconsistente |
| **Dependências** | Alguns pacotes instalados mas não usados (`@google/genai`, `react-hook-form`, etc.) |
| **Testes** | Nenhum teste automatizado |
| **README** | Ainda contém texto do template AI Studio (desatualizado) |

### Variáveis de ambiente

Arquivo de referência: `.env.example`

| Variável | Obrigatória | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública do Supabase |
| `RESEND_API_KEY` | Sim (para e-mail) | Chave da API Resend |
| `GEMINI_API_KEY` | Não | Legado do AI Studio, não usado no código |
| `APP_URL` | Não | Legado do AI Studio, não usado no código |

---

## Referência Rápida

- **Domínio de produção:** `correntedobembr.com.br`
- **E-mail do admin (hardcoded):** `robinho@correntedobembr.com.br`
- **Idioma do site:** Português (pt-BR)
- **Cor primária:** `#00628c`
- **Cor de destaque:** `#bff444`

Para regras de como assistentes de IA devem trabalhar neste projeto, consulte `docs/02_AI_CONTEXT.md`.
