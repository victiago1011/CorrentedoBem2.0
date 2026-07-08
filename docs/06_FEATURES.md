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

---

## Talentos

Permite visualizar profissionais cadastrados.

O visitante pode:

- pesquisar
- filtrar
- visualizar perfil

---

## Negócios

Área destinada à divulgação de negócios e oportunidades.

---

## Notícias

Área destinada à publicação de notícias.

Cada notícia possui sua própria página.

---

## Depoimentos

Exibe relatos publicados pela administração.

---

## Newsletter

Permite cadastrar e-mails para receber novidades.

Integração:

Resend

Banco:

newsletter_subscribers

---

## Contato

Permite envio de mensagens através do formulário.

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

---

## Gestão de Negócios

Permite:

- aprovar
- rejeitar
- editar
- excluir

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