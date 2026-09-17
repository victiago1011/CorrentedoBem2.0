# Painel Administrativo

Versão: 1.0

Última atualização: 17/09/2026

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

Na aprovação de um currículo, se `published_at` estiver vazio, o painel grava `published_at` e `expires_at` (6 meses de calendário). A galeria pública exibe apenas `status = active` com `expires_at` nulo ou ainda no futuro. O Admin continua vendo registros expirados.

No detalhe do currículo, o painel indica:

- Consentimento registrado (`privacy_consent = true`)
- Consentimento não registrado (`NULL`)

Cadastros criados pelo Admin não preenchem campos de aceite.

---

# Aprovação e recusa

Talentos, Vagas, Negócios e Depoimentos passam por aprovação ou recusa no painel.

**Aprovar** mantém o registro no banco e os arquivos associados.

**Recusar** é exclusão definitiva. Não há recuperação nem reavaliação do cadastro recusado neste painel.

Na recusa, o Admin usa o mesmo `DELETE /api/admin/content` da exclusão manual (Fase 2B):

1. Os dados necessários à notificação e ao histórico ficam em memória.
2. O servidor remove a linha no banco.
3. Só após o DELETE confirmado, arquivos válidos do nosso Supabase Storage são removidos.
4. Base64 legado e URLs externas não geram `storage.remove`.
5. Se o cleanup do Storage falhar em parte, o registro **não** é restaurado.
6. O e-mail de recusa, quando a notificação está ligada, é enviado depois da exclusão confirmada, com os dados já em memória.
7. Falha no e-mail **não** recria o cadastro.

Registros antigos com `status = rejected` podem continuar existindo até serem excluídos manualmente.

---

# Negócios

Na aprovação de um negócio, se `published_at` estiver vazio, o painel grava `published_at` e `expires_at` (6 meses). Cadastro direto pelo Admin também grava a janela, sem consentimento.

No detalhe, o painel indica consentimento registrado ou não registrado, e “Publicação expirada” quando `expires_at` já passou. Isso não aparece nos cards da listagem.
