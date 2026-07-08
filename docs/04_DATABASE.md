# Banco de Dados — Corrente do Bem

Este documento descreve o banco de dados atual do projeto Corrente do Bem, baseado nos arquivos SQL existentes e no uso real do Supabase dentro da aplicação.

Não propõe melhorias. Apenas documenta o estado atual.

---

## Visão Geral

O projeto utiliza o **Supabase** como banco de dados e autenticação.

O banco é PostgreSQL, hospedado no Supabase, e é acessado pela aplicação através do cliente definido em:

```text
lib/supabase.ts