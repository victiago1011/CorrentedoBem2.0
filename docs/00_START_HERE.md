# Comece Aqui

> **Este é o primeiro documento que qualquer assistente de IA deve ler** ao trabalhar no projeto Corrente do Bem.

Antes de analisar código, sugerir mudanças ou implementar qualquer coisa, leia este arquivo por completo.

---

# ⚠️ LEITURA OBRIGATÓRIA

Antes de qualquer tarefa, é obrigatório ler os documentos abaixo nesta ordem:

1. **`docs/00_START_HERE.md`** ← você está aqui
2. **`docs/10_CONSTITUTION.md`** ⭐ **DOCUMENTO MAIS IMPORTANTE DO PROJETO**
3. **`docs/01_PROJECT_OVERVIEW.md`**
4. **`docs/02_AI_CONTEXT.md`**
5. Demais documentos apenas quando necessário.

> **O arquivo `10_CONSTITUTION.md` é a Constituição oficial do projeto e possui prioridade sobre qualquer comportamento padrão da IA.**

Se houver conflito entre qualquer documento e a Constituição, **a Constituição sempre prevalece**.

---

# Fluxo obrigatório de trabalho

Toda tarefa deve seguir exatamente esta sequência:

```
1. ENTENDER a tarefa
        ↓
2. ANALISAR o contexto do projeto
        ↓
3. CRIAR um plano
        ↓
4. PARAR COMPLETAMENTE
        ↓
5. AGUARDAR aprovação do usuário
        ↓
6. SOMENTE APÓS "APROVADO" implementar
```

---

# REGRA MAIS IMPORTANTE

Após apresentar um plano:

**PARE COMPLETAMENTE.**

Não:

- implemente;
- altere arquivos;
- gere código;
- gere SQL;
- faça commits;
- faça push;
- continue automaticamente.

A implementação somente poderá iniciar quando o usuário responder exatamente:

# **APROVADO**

Qualquer outra resposta **NÃO** significa autorização.

Mesmo que o usuário faça perguntas, peça ajustes ou discuta o plano, continue apenas planejando.

---

## Passo 1 — Entender a tarefa

- Leia cuidadosamente o pedido do usuário.
- Entenda o objetivo final.
- Se houver dúvidas, pergunte antes de agir.

---

## Passo 2 — Analisar o contexto

Antes de qualquer implementação:

- Leia `10_CONSTITUTION.md`
- Leia `01_PROJECT_OVERVIEW.md`
- Leia `02_AI_CONTEXT.md`
- Analise o código existente.
- Evite reinventar soluções.

---

## Passo 3 — Criar um plano

O plano deve conter:

- Objetivo.
- Estratégia.
- Arquivos que serão alterados.
- Arquivos que NÃO serão alterados.
- Possíveis riscos.

Depois disso:

**PARE COMPLETAMENTE.**

---

## Passo 4 — Aguardar aprovação

Espere o usuário responder exatamente:

**APROVADO**

Somente então a implementação poderá começar.

---

## Passo 5 — Implementar

Após aprovação:

- implemente apenas o que foi aprovado;
- altere o mínimo possível;
- preserve a arquitetura;
- preserve compatibilidade;
- explique claramente o que foi feito.

---

# O que nunca fazer sem aprovação

| Tipo | Exemplos |
|---|---|
| Código | Componentes, páginas, APIs, hooks, utilitários |
| Banco | SQL, migrations, tabelas, policies |
| Configuração | `.env`, `next.config.ts`, `tsconfig.json`, `package.json` |
| Dependências | Instalação ou remoção de bibliotecas |
| Deploy | Vercel |
| Git | Commit, Push, Branch, Merge |
| Documentação | Alterações em `/docs` |

---

# Como responder

Sempre responder nesta ordem:

1. Entendimento
2. Plano
3. Arquivos afetados
4. Banco de dados (se houver)
5. Riscos
6. PARAR

Nunca implementar antes da palavra:

# **APROVADO**

---

# Ferramentas e papéis

| Ferramenta | Papel |
|---|---|
| **ChatGPT** | Arquiteto de Software, Tech Lead e Revisor |
| **Cursor** | Implementador |
| **Usuário** | Product Owner |

---

# Objetivo do projeto

Construir uma plataforma profissional, moderna, escalável, bem documentada e preparada para crescer durante muitos anos.

Todas as decisões devem priorizar:

- simplicidade;
- legibilidade;
- baixo acoplamento;
- reutilização;
- manutenção fácil;
- evolução incremental.

---

# Próximo passo

Após terminar a leitura deste documento:

1. Leia obrigatoriamente **`10_CONSTITUTION.md`**.
2. Depois leia **`01_PROJECT_OVERVIEW.md`**.
3. Somente então prossiga para os demais documentos.