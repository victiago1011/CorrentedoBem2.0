# Comece Aqui

> **Este é o primeiro documento que qualquer assistente de IA deve ler** ao trabalhar no projeto Corrente do Bem.

Antes de analisar código, sugerir mudanças ou implementar qualquer coisa, leia este arquivo por completo.

---

## Ordem de leitura obrigatória

Leia os documentos nesta sequência:

1. **`docs/00_START_HERE.md`** ← você está aqui
2. **`docs/01_PROJECT_OVERVIEW.md`** — o que é o projeto, para quem serve, stack e status atual
3. **`docs/02_AI_CONTEXT.md`** — regras de comportamento para assistentes de IA

Não pule etapas. Não vá direto ao código sem entender o contexto do produto e as regras de trabalho.

---

## Fluxo obrigatório de trabalho

Toda tarefa deve seguir esta sequência, sem exceção:

```
1. ENTENDER a tarefa
        ↓
2. ANALISAR o contexto do projeto
        ↓
3. CRIAR um plano
        ↓
4. AGUARDAR aprovação do usuário
        ↓
5. SÓ ENTÃO implementar
```

### Passo 1 — Entender a tarefa

- Leia o pedido do usuário com atenção
- Identifique o que ele quer alcançar (não apenas o que ele pediu literalmente)
- Se algo estiver ambíguo, pergunte antes de agir

### Passo 2 — Analisar o contexto do projeto

- Leia `01_PROJECT_OVERVIEW.md` e `02_AI_CONTEXT.md`
- Inspecione os arquivos de código relevantes
- Verifique o que já existe — não reinvente soluções

### Passo 3 — Criar um plano

O plano deve ser curto e incluir:

- O que será feito
- Quais arquivos serão afetados
- O que **não** será alterado
- Riscos ou pontos de atenção

Apresente o plano ao usuário e pare. Não implemente ainda.

### Passo 4 — Aguardar aprovação

Espere o usuário dizer explicitamente que aprovou (ex.: "aprovado", "pode fazer", "implemente").

Na dúvida, pergunte. Nunca assuma aprovação.

### Passo 5 — Implementar

- Faça apenas o que foi aprovado no plano
- Use a menor mudança possível
- Respeite a arquitetura e os padrões existentes
- Explique o resultado ao final, passo a passo

---

## O que nunca fazer sem aprovação explícita

| Tipo | Exemplos |
|---|---|
| **Código da aplicação** | Páginas, componentes, rotas de API, utilitários |
| **Arquivos de ambiente** | `.env`, `.env.local`, `.env.example` |
| **Dependências** | `package.json`, `package-lock.json` |
| **Scripts de banco** | `SUPABASE_SETUP.md`, `SUPABASE_NEWSLETTER.sql`, `SUPABASE_ANALYTICS.sql` |
| **Configurações** | `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, etc. |
| **Git** | Commits, push, branches — somente quando o usuário pedir |

Criar ou editar arquivos em `docs/` só quando o usuário solicitar explicitamente.

---

## Como se comunicar com o dono do projeto

O dono deste projeto **não é desenvolvedor profissional**.

Por isso, toda resposta deve ser:

- **Em português claro** — evite jargão técnico sem explicação
- **Passo a passo** — use listas numeradas para procedimentos
- **Objetiva** — diga o que mudou e por que importa
- **Honesta sobre riscos** — avise antes de fazer algo sensível

### Exemplo de boa abordagem

> Entendi que você quer alterar o e-mail de notificação do formulário de contato.
>
> **Plano:**
> 1. Vou verificar onde o e-mail está definido hoje (`app/contato/page.tsx`)
> 2. Proponho trocar o valor fixo por uma variável de ambiente
> 3. Não vou alterar o visual do formulário
>
> Posso prosseguir?

---

## Ferramentas e papéis

| Ferramenta | Papel |
|---|---|
| **ChatGPT** | Arquiteto — planeja, analisa e explica |
| **Cursor** | Implementação — executa código após aprovação |
| **Usuário** | Decide o que será feito e aprova cada etapa |

---

## Próximo passo

Leia agora: **[01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md)**
