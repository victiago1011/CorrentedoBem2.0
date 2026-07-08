# Corrente do Bem — Contexto para Assistentes de IA

Este documento define **como qualquer assistente de IA deve trabalhar** neste projeto. Leia-o antes de sugerir ou implementar qualquer mudança.

---

## Papéis de cada ferramenta

| Ferramenta | Papel |
|---|---|
| **ChatGPT** | Arquiteto de software — planeja, analisa, explica e propõe soluções |
| **Cursor** | Ferramenta de implementação — executa o código após aprovação do usuário |
| **Usuário (Victor)** | Dono do projeto — decide o que será feito e aprova cada etapa |

### Divisão de responsabilidades

- O **ChatGPT** não deve pedir ao usuário para editar código manualmente se o Cursor pode fazer isso.
- O **Cursor** não deve implementar mudanças sem um plano aprovado.
- O **usuário** não é desenvolvedor profissional — toda explicação deve ser clara, passo a passo e em português.

---

## Fluxo obrigatório de trabalho

Toda tarefa deve seguir esta sequência:

```
1. ENTENDER  →  2. PLANEJAR  →  3. APROVAR  →  4. IMPLEMENTAR
```

### 1. Entender antes de mudar

Antes de qualquer alteração:

- Ler `docs/01_PROJECT_OVERVIEW.md` para contexto do produto
- Ler este arquivo (`docs/02_AI_CONTEXT.md`) para regras de trabalho
- Inspecionar os arquivos relevantes do código
- Confirmar o que já existe antes de sugerir algo novo
- Identificar impacto da mudança (quais páginas, tabelas ou APIs serão afetadas)

**Nunca assuma como o projeto funciona.** Verifique no código.

### 2. Criar um plano antes de implementar

Toda proposta de mudança deve incluir:

- **O que** será alterado (arquivos e trechos específicos)
- **Por que** a mudança é necessária
- **Como** será feita (passo a passo)
- **Riscos** ou efeitos colaterais possíveis
- **O que não será alterado** (para manter o escopo controlado)

Apresente o plano de forma resumida e aguarde aprovação.

### 3. Nunca modificar código sem aprovação explícita

Regras absolutas:

- **Não editar arquivos** até o usuário dizer explicitamente que aprovou
- **Não criar arquivos** além do que foi solicitado
- **Não deletar arquivos** sem autorização
- **Não fazer commit** no Git sem pedido do usuário
- **Não alterar** `package.json`, `.env` ou arquivos de configuração sem pedido explícito

Frases como "pode fazer", "aprovado" ou "implemente" contam como aprovação. Na dúvida, pergunte.

### 4. Implementar com escopo mínimo

Após aprovação:

- Fazer apenas o que foi aprovado no plano
- Usar a menor mudança possível que resolva o problema
- Seguir os padrões já existentes no código (nomes, estilo, estrutura)
- Não refatorar código não relacionado à tarefa
- Informar o que foi feito e como testar

---

## Regras de arquitetura

### Respeitar a arquitetura existente

Este projeto tem uma arquitetura definida. Não a substitua sem discussão:

| Decisão atual | O que fazer |
|---|---|
| Next.js App Router | Manter — não migrar para Pages Router |
| Client Components (`'use client'`) | Manter o padrão atual nas páginas |
| Supabase como banco + auth | Manter — não introduzir outro banco |
| Resend para e-mail | Manter — não trocar por outro serviço sem alinhamento |
| Tailwind CSS 4 | Manter — não introduzir outro framework de CSS |
| Componentes em `app/components/` | Reutilizar e estender, não recriar em outro lugar |

### Padrões de código a seguir

- **Idioma do site:** português (pt-BR) em textos visíveis ao usuário
- **Cor primária:** `#00628c`
- **Fontes:** Inter (corpo) e Plus Jakarta Sans (títulos)
- **Ícones:** Lucide React
- **Animações:** `motion/react` (não `framer-motion`)
- **Utilitários:** funções em `lib/utils.ts` (`cn`, `maskPhone`, `stripHtml`, etc.)
- **Supabase:** cliente único em `lib/supabase.ts`
- **Alias de importação:** `@/` aponta para a raiz do projeto

### O que evitar

- Criar abstrações ou helpers para lógica usada em um único lugar
- Adicionar dependências novas sem necessidade clara
- Mover arquivos ou renomear pastas sem motivo
- Reescrever o painel admin inteiro em uma única tarefa
- Introduzir Server Components ou Server Actions sem planejamento (o projeto é majoritariamente client-side hoje)

---

## Consultar a documentação antes de sugerir mudanças

Ordem de leitura recomendada:

1. `docs/01_PROJECT_OVERVIEW.md` — entender o produto
2. `docs/02_AI_CONTEXT.md` — entender as regras (este arquivo)
3. Arquivos SQL na raiz — entender o banco de dados
4. Código-fonte dos arquivos afetados pela tarefa

Se a documentação e o código divergirem, **o código é a fonte de verdade técnica**. Atualize a documentação se necessário (com aprovação do usuário).

---

## Como se comunicar com o usuário

O usuário **não é desenvolvedor profissional**. Portanto:

### Faça

- Explique em português claro e direto
- Use passos numerados para qualquer procedimento
- Diga **o que mudou** e **por que importa** em linguagem simples
- Avise sobre riscos antes de implementar
- Resuma o resultado ao final de cada tarefa
- Pergunte quando houver mais de uma opção válida

### Não faça

- Usar jargão sem explicar (ex.: "refatorar o middleware RLS" sem contexto)
- Assumir que o usuário sabe usar terminal, Git ou Supabase
- Fazer mudanças "de brinde" que não foram pedidas
- Listar 10 melhorias não solicitadas ao final de cada resposta
- Pedir ao usuário para editar código manualmente quando o Cursor pode fazer

### Exemplo de boa comunicação

> **Plano:** Vou alterar apenas o arquivo `app/contato/page.tsx` para trocar o e-mail de notificação hardcoded por uma variável de ambiente. Isso não muda o visual do formulário. Preciso da sua aprovação para criar a variável `ADMIN_EMAIL` no `.env.example`. Posso prosseguir?

---

## Áreas sensíveis — cuidado redobrado

Estas áreas têm riscos maiores. Qualquer mudança exige plano detalhado e aprovação explícita:

| Área | Risco |
|---|---|
| `app/api/send-email` e `app/api/send-campaign` | Envio de e-mail em massa; rotas sem autenticação hoje |
| `lib/supabase.ts` | Afeta todo o projeto |
| Scripts SQL (`SUPABASE_*.sql`, `SUPABASE_SETUP.md`) | Alteram estrutura e permissões do banco |
| `app/admin/page.tsx` | Arquivo muito grande; mudanças podem ter efeitos inesperados |
| `.env` e `.env.example` | Contêm chaves e segredos |
| Políticas RLS no Supabase | Controlam quem pode ler/escrever dados |

---

## Checklist antes de cada tarefa

Use este checklist mental antes de começar:

- [ ] Li a documentação em `docs/`
- [ ] Entendi qual módulo/página será afetado
- [ ] Verifiquei o código existente (não estou reinventando algo que já existe)
- [ ] Criei um plano e apresentei ao usuário
- [ ] Recebi aprovação explícita
- [ ] Minha mudança é a menor possível para resolver o problema
- [ ] Não vou alterar arquivos fora do escopo aprovado
- [ ] Sei como o usuário pode testar o resultado

---

## Resumo em uma frase

> **Entenda o projeto, planeje com clareza, peça aprovação, implemente o mínimo necessário, explique tudo passo a passo.**
