Derive specs from brainstorming for session: $ARGUMENTS

## Instruções

Você vai derivar especificações estruturadas a partir do material bruto de brainstorming. O tipo de spec depende da CATEGORIA do input (app, experiment, infra).

### Step 1 — Resolução de paths

O argumento passado pode ser:
- **Diretório**: `.projeto/1-brainstoming/` → lê todos os .md do diretório
- **Arquivo**: `.projeto/1-brainstoming/EXPERIMENTO.md` → lê apenas esse arquivo (e documentos de referência citados nele)
- **Formato legado**: `{projeto}/{milestone}` → resolve para `projects/{projeto}/{milestone}/01-brainstorming/`

Inferência de output:
- Se input contém `brainstom` → output substitui por pasta equivalente de specs (ex: `.projeto/1-brainstoming/` → `.projeto/3-specs/`)
- Se input contém `01-brainstorming` → output substitui `01-brainstorming` por `02-specs`
- Se nenhum match, escrever specs no mesmo nível do input em pasta `specs/`

Inferência de guia de formato:
- Procurar `SPECS.md` em: `.projeto/0-guides/what-is/SPECS.md` OU `projects/.meta/what-is/SPECS.md`
- Usar o primeiro encontrado

### Step 2 — Leia os brainstormings

Leia cada arquivo .md no path de input **na íntegra**. Para arquivos grandes (>500 linhas), leia em chunks de 500 linhas. Não pule nenhum arquivo. Confirme a leitura de cada um antes de prosseguir.

Se o argumento aponta para um arquivo único, leia esse arquivo e também qualquer documento de referência que ele cite explicitamente (ex: "ver documento X em documentos/").

### Step 3 — Classificação (OBRIGATÓRIO)

Classifique o brainstorming usando a tabela de indicadores do SPECS.md:

| Indicador | app | experiment | infra |
|-----------|-----|------------|-------|
| Menciona telas, formulários, CRUD | ✅ | - | - |
| Menciona usuários finais e roles | ✅ | - | - |
| Menciona waves, ciclos, iterações | - | ✅ | - |
| Menciona agentes autônomos | - | ✅ | - |
| Menciona artefatos intermediários (rankings, configs) | - | ✅ | - |
| Menciona pipelines, deploy, networking | - | - | ✅ |
| Menciona monitoramento de infra | - | - | ✅ |

**Regra crítica**: Se descreve um PROCESSO que constrói um PRODUTO, especifique o PROCESSO (= experiment), não o produto.

**Declaração obrigatória** (exiba antes de prosseguir):

```
**Categoria: {app|experiment|infra}** — {justificativa em uma frase}
```

Se a categoria for `infra`: informar "Categoria infra ainda em desenvolvimento. Specs de infra (Tipo I1-I4) serão definidos em versão futura." e parar.

### Step 4 — Leia o guia de formato

Leia o `SPECS.md` encontrado no Step 1 na íntegra. Foque nos tipos da categoria identificada:
- Se `app` → Tipo 1-6
- Se `experiment` → Tipo E1-E4

Entenda e memorize TODOS os padrões antes de prosseguir. Esses padrões são VINCULANTES.

### Step 5 — Contexto do projeto

#### Se `app`:
- `docker-compose*.yml` — stack de infraestrutura
- `package.json` — monorepo e dependências
- `database/migrations/` — padrões SQL existentes (leia pelo menos a primeira migration)

#### Se `experiment`:
- `.harness/agents/` — agentes já definidos (se existir)
- `.harness/scripts/` — scripts de orquestração (se existir)
- `.claude/commands/` — commands existentes que podem ser agentes
- Documentos de referência citados no brainstorming (em `documentos/`, `refs/`, etc.)
- Schemas/contratos existentes no projeto

### Step 6 — Geração

#### Se `app` → Gerar Tipo 1-6:

Para cada arquivo, leia o template (se existir) e o stub existente no output antes de escrever.

**6.1. `{projeto}-requirements.md`** — Requisitos OSD
- Prefixo `OSD` para funcionais, `RNF` para não funcionais
- Formato TABELA: `| ID | Requisito |`
- IDs sequenciais com faixas por módulo (gaps de 10-20 entre módulos)
- Cada requisito: uma frase, verbo infinitivo, capacidade testável
- Inclua Matriz de Permissões quando envolver perfis de acesso
- Seção final de Rastreabilidade: módulo → faixa de IDs

**6.2. `{projeto}-user-stories.md`** — User Stories
- Prefixo `US` com IDs sequenciais, faixas por perfil de usuário
- Formato: Como/Quero/Para + Critérios de Aceite como checklist `- [ ]`
- Sempre referenciar IDs OSD do requirements
- Agrupar por tipo de usuário
- Seção final de Rastreabilidade: US → OSD

**6.3. `{projeto}-design.md`** — Design e Arquitetura
- Stack como tabela com justificativa
- Estrutura do monorepo como árvore
- Fluxos em listas numeradas ou diagramas ASCII
- Bibliotecas com versão
- Convenções de código como tabela
- Decisões técnicas são vinculantes

**6.4. `{projeto}-er.md`** — Modelo de Dados
- Diagrama Mermaid `erDiagram` no topo
- Uma subsecção por entidade com tabela de campos
- Tabelas e campos em snake_case (inglês)
- Enums e índices em blocos SQL
- Relacionamentos como lista numerada com cardinalidade
- Seguir padrões SQL existentes no projeto (UUID PKs, TIMESTAMPTZ, triggers)

**6.5. `{projeto}-ui-guide.md`** — Guia de UI/UX
- Pular se já estiver preenchido (não sobrescrever)
- Tokens semânticos como tabela
- Componentes por categoria
- Padrões de página com JSX
- Checklist de acessibilidade

**6.6. Feature Specs** — quando aplicável
- Formato Feature Spec (seções numeradas)
- IDs próprios com prefixo da feature
- Componentes com interface TS de props
- Schema SQL se necessário
- Métricas de sucesso com valores numéricos

#### Se `experiment` → Gerar Tipo E1-E4:

**6.1. `{projeto}-protocol.md`** — Protocolo de Execução
- Prefixo `PROT` com IDs sequenciais
- Diagrama ASCII obrigatório do ciclo macro (waves → steps → gates)
- Cada step como linha de tabela: #, nome, agente, pré-condição, pós-condição, error handling
- Decision gates: tabela (condição | GO | STOP)
- Critério de parada global formal
- Rastreabilidade: step → agente → gate

**6.2. `{projeto}-data-contracts.md`** — Contratos de Dados
- Prefixo `DC` com IDs sequenciais
- Schema TypeScript/Zod para cada artefato trocado entre agentes
- Exemplo concreto para cada schema
- Lifecycle: quem cria, quem lê, quem atualiza
- Rastreabilidade cruzada com Protocol (PROT)

**6.3. `{projeto}-agents.md`** — Especificação de Agentes
- Prefixo `AGT` com IDs sequenciais
- Subsecção por agente na ordem de execução
- Params obrigatórios: tools, max_turns, rollback, timeout
- Inputs/outputs com nome de artefato e descrição
- Autoridade de decisão: o que pode e o que não pode
- Diagrama de handoff entre agentes
- Matriz de autoridade como tabela cruzada
- Rastreabilidade com Protocol e Data Contracts

**6.4. `{projeto}-success-criteria.md`** — Critérios de Sucesso
- Prefixo `SC` com IDs sequenciais
- Critérios por nível: processo, wave, agente
- Cada critério: métrica, threshold, medição, consequência
- Cenários de falha: falha | detecção | ação
- Rastreabilidade cruzada com Protocol, Agents e Data Contracts

### Step 7 — Validação final

Ao terminar, liste os arquivos gerados com contagem de IDs:

```
| Arquivo | IDs | Prefixo | Faixa |
|---------|-----|---------|-------|
| {projeto}-protocol.md | 12 | PROT | PROT001-PROT012 |
| {projeto}-data-contracts.md | 8 | DC | DC001-DC008 |
| ...
```

### Regras gerais

- Português no texto, inglês no código
- Tom direto, declarativo, sem floreio
- Tabelas markdown onde poderia ter parágrafos
- Sem duplicação entre specs
- Cada ID é único e referenciável
- Referências cruzadas entre documentos (agents → protocol, data-contracts → protocol, success-criteria → todos)
- Aplicar Checklist de Qualidade do SPECS.md antes de finalizar
