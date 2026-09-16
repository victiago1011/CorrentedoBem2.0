# Funcionalidades do Sistema

Versão: 1.0

Última atualização: 07/07/2026

Status: Oficial

---

# Objetivo

Este documento descreve todas as funcionalidades existentes na plataforma Corrente do Bem.

Ele serve como referência para qualquer alteração futura, garantindo que novas implementações respeitem a estrutura já existente.

---

# Visão Geral

A plataforma possui dois grandes módulos:

- Site Público
- Painel Administrativo

---

# Site Público

O site público é acessível para qualquer visitante.

Possui os seguintes módulos.

## Página Inicial

Objetivos:

- apresentar a plataforma
- divulgar oportunidades
- captar novos usuários
- incentivar inscrições

---

## Vagas

Permite visualizar vagas aprovadas.

O visitante pode:

- pesquisar
- filtrar
- visualizar detalhes
- candidatar-se

O cadastro público em `/vagas/cadastrar` exige aceite dos Termos de Uso e da Política de Privacidade, com declaração de autorização para divulgar a vaga.

---

## Talentos

Permite visualizar profissionais cadastrados.

O visitante pode:

- pesquisar
- filtrar
- visualizar perfil (incluindo e-mail, telefone e currículo após aprovação)

O cadastro público em `/talentos/cadastrar` exige duas confirmações desmarcadas por padrão: aceite dos Termos de Uso e autorização expressa de publicação pública. O aceite é gravado com data e versão. Não há backfill de consentimento em registros antigos.

Perfis aprovados podem permanecer públicos por até 6 meses após a aprovação. A listagem pública oculta registros com `expires_at` no passado, sem apagar o cadastro. Registros antigos sem janela (`expires_at` NULL) continuam visíveis.

---

## Negócios

Área destinada à divulgação de negócios e oportunidades.

O cadastro público em `/negocios/cadastrar` exige duas confirmações desmarcadas: aceite dos Termos (com declaração de legitimidade) e autorização de publicação após aprovação. O aceite é gravado com data e versão. Cadastros Admin não recebem consentimento artificial.

Após aprovação, podem ficar públicos: título, nome do negócio, localização, tipo, área, descrição, link, logo, e-mail, telefone e anexos. O nome do responsável permanece interno.

Negócios aprovados podem permanecer públicos por até 6 meses após a aprovação. Pendentes não consomem esse prazo. A listagem pública oculta expirados sem exclusão física.

---

## Notícias

Área destinada à publicação de notícias.

Cada notícia possui sua própria página.

---

## Depoimentos

Exibe relatos publicados pela administração.

O envio público em `/depoimentos/novo` exige uma confirmação desmarcada (Termos, Política e autorização de publicação). Nome, foto, cargo, empresa e texto podem ficar públicos após aprovação. O e-mail é interno e não é exibido. Não há prazo automático de expiração.

---

## Newsletter

A lista é gerida no painel administrativo (`/admin/emails`). Não há inscrição pública no site. Campanhas usam Resend; cliques do botão principal podem ser rastreados; o descadastro ocorre pelo link da mensagem (`/api/unsubscribe`).

Banco: `newsletter_subscribers`.

---

## Contato

Permite o envio de mensagens pelo formulário em `/contato`.

Fluxo atual:

1. O visitante preenche o formulário.
2. O sistema valida os dados.
3. A mensagem é enviada pelo Resend (`POST /api/send-email`) para `robinho@correntedobembr.com.br`.
4. O e-mail do visitante é utilizado como Reply-To.
5. O remetente institucional é `contato@send.correntedobembr.com.br`.
6. O formulário só exibe sucesso se o Resend confirmar o envio.
7. Em caso de falha, o visitante recebe uma mensagem amigável e pode tentar novamente.

A mensagem é enviada pelo Resend e **não** alimenta o painel administrativo. A tabela `contatos` é legada e pode conter registros históricos; o formulário vigente não faz INSERT nela.

O formulário inclui aviso com link para a Política de Privacidade, sem checkbox obrigatória.

O formulário inclui o assunto “Solicitar alteração ou exclusão de currículo ou vaga”. Esse é o canal inicial para pedidos de correção, despublicação ou exclusão. O e-mail real de atendimento é `robinho@correntedobembr.com.br`.

Não existe view “Mensagens de Contato” no painel administrativo.

---

# Painel Administrativo

Área restrita.

Autenticação via Supabase Auth.

Permite gerenciamento completo da plataforma.

---

## Gestão de Vagas

Permite:

- aprovar
- rejeitar
- editar
- excluir

---

## Gestão de Talentos

Permite:

- aprovar
- rejeitar
- editar
- excluir

Na aprovação, o painel registra `published_at` e `expires_at` (6 meses de calendário) quando ainda não existirem. O detalhe mostra se o consentimento foi registrado. A galeria pública oculta expirados; o Admin continua exibindo o registro.

---

## Gestão de Negócios

Permite:

- aprovar
- rejeitar
- editar
- excluir

Na aprovação ou no cadastro direto publicado, o painel registra `published_at` e `expires_at` (6 meses) quando a janela ainda não existir. O detalhe mostra se o consentimento foi registrado e, se aplicável, se a publicação expirou. Cadastros Admin não preenchem aceite.

---

## Gestão de Notícias

Permite:

- criar
- editar
- publicar
- excluir

---

## Gestão de Depoimentos

Permite:

- aprovar
- rejeitar
- editar
- excluir

---

## Newsletter

Permite:

- visualizar inscritos
- enviar campanhas
- acompanhar estatísticas

---

## Analytics

Exibe indicadores de visitas do site.

---

# Fluxo Geral

Visitante

↓

Cadastro

↓

Status pendente

↓

Painel Administrativo

↓

Aprovação

↓

Publicação

---

# Regras Gerais

Todo conteúdo publicado deve passar pelo painel administrativo.

A publicação direta não faz parte do fluxo padrão.

---

# Integrações

Supabase

- banco de dados
- autenticação

Resend

- envio de e-mails

Cloudflare

- DNS

Vercel

- hospedagem

---

## Histórico

### v1.0

Documento criado.

---

Este documento faz parte da documentação oficial do projeto Corrente do Bem.