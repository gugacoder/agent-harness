Derive specs from brainstorming for session: $ARGUMENTS

## Instruções

Você vai derivar especificações estruturadas a partir do material bruto de brainstorming.

### 1. Leia as referências de formato (OBRIGATÓRIO antes de tudo)

```
projects/.meta/what-is/SPECS.md          ← Formato canônico (OSD, US, ER, Design, UI, Feature)
projects/.meta/template/02-specs/*.md    ← Templates dos arquivos de saída
```

Entenda e memorize TODOS os padrões antes de prosseguir. Esses padrões são VINCULANTES.

### 2. Identifique o projeto e milestone

O argumento passado pode ser:
- `{projeto}/{milestone}` (ex: `pontofacil/01-mvp-cartao-de-ponto`)
- `{milestone}` (assume projeto único se só houver um em `projects/`)

Caminhos:
- **Input**: `projects/{projeto}/{milestone}/01-brainstorming/` — TODOS os arquivos .md
- **Output**: `projects/{projeto}/{milestone}/02-specs/` — arquivos de spec
- **Refs**: `projects/{projeto}/{milestone}/04-refs/` — referências técnicas adicionais
- **Refs globais**: `projects/.meta/refs/` — biblioteca de referências compartilhadas

### 3. Leia TODOS os brainstormings

Leia cada arquivo em `projects/{projeto}/{milestone}/01-brainstorming/` **na íntegra**. Para arquivos grandes (>500 linhas), leia em chunks de 500 linhas. Não pule nenhum arquivo. Confirme a leitura de cada um antes de prosseguir.

### 4. Leia o contexto do projeto

- `docker-compose*.yml` — stack de infraestrutura
- `package.json` — monorepo e dependências
- `database/migrations/` — padrões SQL existentes (leia pelo menos a primeira migration)

### 5. Gere os specs na ordem

Para cada arquivo, leia o template em `projects/.meta/template/02-specs/` e o stub existente em `projects/{projeto}/{milestone}/02-specs/` antes de escrever.

#### 5.1. `requirements.md` — Requisitos OSD

- Prefixo `OSD` para funcionais, `RNF` para não funcionais
- Formato TABELA: `| ID | Requisito |`
- IDs sequenciais com faixas por módulo (gaps de 10-20 entre módulos)
- Cada requisito: uma frase, verbo infinitivo, capacidade testável
- Inclua Matriz de Permissões quando envolver perfis de acesso
- Seção final de Rastreabilidade: módulo → faixa de IDs

#### 5.2. `user-stories.md` — User Stories

- Prefixo `US` com IDs sequenciais, faixas por perfil de usuário
- Formato: Como/Quero/Para + Critérios de Aceite como checklist `- [ ]`
- Sempre referenciar IDs OSD do requirements
- Agrupar por tipo de usuário
- Seção final de Rastreabilidade: US → OSD

#### 5.3. `design.md` — Design e Arquitetura

- Stack como tabela com justificativa
- Estrutura do monorepo como árvore
- Fluxos em listas numeradas ou diagramas ASCII
- Bibliotecas com versão
- Convenções de código como tabela
- Decisões técnicas são vinculantes

#### 5.4. `er.md` — Modelo de Dados

- Diagrama Mermaid `erDiagram` no topo
- Uma subsecção por entidade com tabela de campos
- Tabelas e campos em snake_case (inglês)
- Enums e índices em blocos SQL
- Relacionamentos como lista numerada com cardinalidade
- Seguir padrões SQL existentes no projeto (UUID PKs, TIMESTAMPTZ, triggers)

#### 5.5. `ui-guide.md` — Guia de UI/UX

- Pular se já estiver preenchido (não sobrescrever)
- Tokens semânticos como tabela
- Componentes por categoria
- Padrões de página com JSX
- Checklist de acessibilidade

#### 5.6. `onboarding.md` — Sistema de Onboarding

- Formato Feature Spec (seções numeradas)
- IDs próprios com prefixo `OB`
- Componentes com interface TS de props
- Schema SQL se necessário
- Métricas de sucesso com valores numéricos

### 6. Validação final

Ao terminar, liste os arquivos gerados com contagem de IDs:

```
| Arquivo | IDs | Faixa |
|---------|-----|-------|
| requirements.md | 75 OSD + 14 RNF | OSD001-OSD291, RNF001-RNF034 |
| user-stories.md | 27 US | US001-US062 |
| ...
```

### Regras gerais

- Português no texto, inglês no código
- Tom direto, declarativo, sem floreio
- Tabelas markdown onde poderia ter parágrafos
- Sem duplicação entre specs (cores só no ui-guide, tabelas só no ER, stack só no design)
- Cada ID é único e referenciável
- Referências cruzadas entre documentos (US → OSD, Design → OSD)
