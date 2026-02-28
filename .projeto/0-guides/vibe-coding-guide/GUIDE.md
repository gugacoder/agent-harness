# Aprendizados VibeCoding

## Estrutura Monorepo

O projeto segue uma estrutura monorepo organizada assim:

```
apps/
  <app-name>/         # cada app é um diretório em apps/
  packages/
    <package-name>/   # pacotes compartilhados entre apps
```

- **`apps/`** — contém todos os apps do sistema (ex: central, lojista, motoboy, api)
- **`apps/packages/`** — contém pacotes compartilhados entre os apps (libs, utils, tipos, etc.)

Todo código novo deve respeitar esta organização. Apps nunca devem viver fora de `apps/` e pacotes compartilhados nunca devem viver fora de `apps/packages/`.

## DO NOT HARDCODE DEFAULTS FOR VARIABLES DECLARED IN .ENV

O `.env` é a fonte da verdade para configuração. Fallbacks hardcoded mascaram erros de configuração ao permitir que o sistema funcione com valores que não vieram do `.env`. Se o `.env` está mal configurado, o sistema deve falhar — não silenciosamente assumir outro valor.

NOT ACCEPTABLE
```
const PORT = process.env.BACKBONE_COMMON_PORT || 9090;
BACKBONE_COMMON_PORT: z.coerce.number().default(9001),
- "${EXPORT_WHISPER_PORT:-9095}:8000"
```

ACCEPTABLE
```
const PORT = process.env.BACKBONE_COMMON_PORT;
BACKBONE_COMMON_PORT: z.coerce.number(),
- "${EXPORT_WHISPER_PORT}:8000"
```

## Eventos SSE sim, polling jamais

**Polling é proibido.** Não use `refetchInterval` em queries do React Query ou outros mecanismos de polling. Polling consome desnecessariamente recursos de tráfego e aumenta o custo da hospedagem do sistema.

**A solução correta é usar os canais SSE existentes.** O backbone emite eventos via SSE (`/system/events`) que devem ser a fonte de verdade para atualizações em tempo real. Use invalidação de queries via SSE para manter dados atualizados. Queries devem buscar dados apenas:
1. Na montagem inicial do componente
2. Em resposta a eventos SSE (via `invalidateQueries`)
3. Após mutações do usuário (via `onSuccess` das mutations)

**É proibido criar novos canais SSE sem justificativa clara.** Antes de criar um novo endpoint ou canal SSE, avalie os canais existentes no sistema:
- `/system/events` — canal principal de eventos do sistema (heartbeat, channels, registry, jobs, modules)
- Canais por channel em `/channels/:id/events`

Novos event types devem ser adicionados ao canal existente sempre que possível. Só crie um canal separado se houver necessidade técnica comprovada (ex: volume de dados incompatível com o canal principal).

## Prefixo de Rota por App

Todo app deve ter um prefixo de rota próprio para facilitar roteamento em proxy reverso, gateway ou load balancer. Sem prefixo, todos os apps competem pelo mesmo namespace de rotas e o roteamento vira frágil.

| App | Prefixo |
|---|---|
| Central da Empresa | `/central/...` |
| App do Lojista | `/lojista/...` |
| App do Motoboy | `/motoboy/...` |
| API | `/api/...` |

O prefixo é definido uma vez e usado consistentemente em rotas internas, links e configuração de proxy.

## Fail Proof Apps

Não há hipótese válida para o app web receber falhas das séries 400 e 500, exceto por:
1. 401 e 403
2. Perda de conexão entre app e backend

O sistema deve ser construído de forma a SEMPRE resultar 200 OK com payload contendo informação clara sobre falha ou sucesso para que a aplicação seja capaz de reagir apropriadamente em vez de crashar.

Por tanto, escreva um software robusto com tratamento de falha apropriado.
