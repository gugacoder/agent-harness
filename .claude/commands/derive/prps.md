Derive PRPs from specs for session: $ARGUMENTS

## Instruções

Você vai derivar PRPs (Product Requirements Prompts) a partir das specs já geradas.

### 1. Leia as referências de formato (OBRIGATÓRIO antes de tudo)

Procure os guias de formato nesta ordem de prioridade:
1. `.projeto/0-guides/what-is/PRP.md` e `.projeto/0-guides/what-is/SPECS.md`
2. `projects/.meta/what-is/PRP.md` e `projects/.meta/what-is/SPECS.md`

Use o primeiro par encontrado. Entenda e memorize antes de prosseguir.

### 2. Resolução de paths

O argumento passado pode ser:
- **Diretório de specs**: `.projeto/3-specs/` → lê todos os .md do diretório
- **Formato legado**: `{projeto}/{milestone}` → resolve para `projects/{projeto}/{milestone}/02-specs/`
- **Milestone apenas**: `{milestone}` → assume projeto único se só houver um em `projects/`

Inferência de output:
- Se input contém `3-specs` → output usa `4-prps` no mesmo nível
- Se input contém `02-specs` → output substitui por `03-prps`

Caminhos (quando usando formato legado):
- **Specs**: `projects/{projeto}/{milestone}/02-specs/`
- **Output**: `projects/{projeto}/{milestone}/03-prps/`
- **Refs**: `projects/{projeto}/{milestone}/04-refs/`
- **Refs globais**: `projects/.meta/refs/`

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

Conforme o guia PRP.md encontrado no Step 1:

- **Objetivo** — o que deve ser produzido (1-2 frases)
- **Execution Mode** — `implementar` | `documentar` | `simular` | `gerar mock` | `não inferir`
- **Contexto** — estado atual do código relevante (o que existe, onde está, padrões usados). Descreva, não cole.
- **Especificação** — requisitos detalhados referenciando IDs das specs. Prefixos possíveis: app (OSD, US, RNF), experiment (PROT, DC, AGT, SC). Regras, formatos, validações.
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

Para specs de app:
```
| PRP | Escopo | Specs cobertas | Depende de |
|-----|--------|----------------|------------|
| PRP-001 | Migrations base | OSD001-OSD030, er.md §1-2 | — |
| PRP-002 | API Funcionários | OSD001-OSD009, US001 | PRP-001 |
```

Para specs de experiment:
```
| PRP | Escopo | Specs cobertas | Depende de |
|-----|--------|----------------|------------|
| PRP-001 | Orquestrador | PROT001-PROT003, AGT001 | — |
| PRP-002 | Agente feature-gen | AGT002, DC001-DC002, SC005 | PRP-001 |
```

Aplique o checklist do guia PRP.md em cada PRP antes de finalizar.
