Derive PRPs from specs for session: $ARGUMENTS

## Instruções

Você vai derivar PRPs (Product Requirements Prompts) a partir das specs já geradas.

### 1. Leia as referências de formato (OBRIGATÓRIO antes de tudo)

```
projects/.meta/what-is/PRP.md             ← O que é PRP, estrutura, checklist
projects/.meta/what-is/SPECS.md           ← Formato das specs (para entender os IDs)
```

Entenda e memorize antes de prosseguir.

### 2. Identifique o projeto e milestone

O argumento passado pode ser:
- `{projeto}/{milestone}` (ex: `pontofacil/01-mvp-cartao-de-ponto`)
- `{milestone}` (assume projeto único se só houver um em `projects/`)

Caminhos:
- **Specs**: `projects/{projeto}/{milestone}/02-specs/` — fonte de verdade do QUE deve ser feito
- **Output**: `projects/{projeto}/{milestone}/03-prps/` — PRPs gerados
- **Refs**: `projects/{projeto}/{milestone}/04-refs/` — referências técnicas
- **Refs globais**: `projects/.meta/refs/` — biblioteca de referências compartilhadas

### 3. Leia TODAS as specs

Leia cada arquivo em `projects/{projeto}/{milestone}/02-specs/` na íntegra. Para arquivos grandes (>500 linhas), leia em chunks de 500 linhas.

### 4. Examine o estado atual do código

Mapeie o que já existe no projeto:
- Estrutura de diretórios (`portal/`, `backbone/`, `database/`)
- Migrations existentes (padrão SQL, última numeração)
- Componentes UI já criados
- API routes existentes
- Padrões de código estabelecidos (naming, imports, estrutura de arquivos)

Isso é CRÍTICO. O PRP funde specs + estado real. Não ignore o que já existe.

### 5. Defina os PRPs por escopo

Quebre as specs em PRPs de escopo executável. Cada PRP deve ser:
- **Autossuficiente** — uma IA consegue executar sem ler outros PRPs
- **Escopo fechado** — começo, meio e fim claros
- **Sem código fonte** — descreve intenção, referencia contexto, não cola código
- **Declarativo** — afirma o que é, não sugere o que poderia ser

Critérios para quebra:
- Um PRP por módulo/feature ou por camada (DB → API → UI)
- PRPs de infraestrutura antes de PRPs de feature
- Dependências explícitas entre PRPs

### 6. Para cada PRP, siga a estrutura

Conforme `projects/.meta/what-is/PRP.md`:

- **Objetivo** — o que deve ser produzido (1-2 frases)
- **Execution Mode** — `implementar` | `documentar` | `simular` | `gerar mock` | `não inferir`
- **Contexto** — estado atual do código relevante (o que existe, onde está, padrões usados). Descreva, não cole.
- **Especificação** — requisitos detalhados referenciando IDs das specs (OSD, US, RNF). Regras, formatos, validações.
- **Limites** — o que a IA NÃO deve fazer (não alterar X, não criar Y, não mudar padrão Z)
- **Exemplos** — input/output esperado quando houver ambiguidade

### 7. Referências, não cópias

O PRP referencia contexto, não reproduz:

```
❌ "Crie a tabela cp_funcionarios com as colunas id UUID, nome VARCHAR(255)..."
✅ "Crie as tabelas de funcionários conforme er.md seção 2. Siga o padrão SQL das migrations existentes (UUID PKs, TIMESTAMPTZ, triggers de updated_at)."

❌ [cola 50 linhas de um componente existente]
✅ "Siga o padrão do componente DataTable já usado em portal/src/components/deliveries/. Adapte para as colunas definidas em OSD001."
```

A IA é engenheira, não copista. Dê intenção e limites, não gabarito.

### 8. Nomeação dos arquivos

```
projects/{projeto}/{milestone}/03-prps/
  PRP-001-{escopo-curto}.md
  PRP-002-{escopo-curto}.md
  ...
```

Numeração sequencial. Nome descritivo em kebab-case.

### 9. Validação final

Ao terminar, liste os PRPs gerados:

```
| PRP | Escopo | Specs cobertas | Depende de |
|-----|--------|----------------|------------|
| PRP-001 | Migrations base | OSD001-OSD030, er.md §1-2 | — |
| PRP-002 | API Funcionários | OSD001-OSD009, US001 | PRP-001 |
| ...
```

Aplique o checklist de `projects/.meta/what-is/PRP.md` em cada PRP antes de finalizar.
