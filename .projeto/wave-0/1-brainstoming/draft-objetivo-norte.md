# Objetivo Norte — Chega.la

## Frase-Norte

**Construir o Chega.la: Central da Empresa, App do Lojista e App do Motoboy — três módulos sincronizados em tempo real via backbone SSE — que substitui o caos do WhatsApp por uma operação estruturada com IA progressiva, pronta para clientes reais.**

## O Produto

O Chega.la é um aplicativo inteligente para empresas de entregas rápidas e logística. Resolve o gargalo operacional do atendimento via WhatsApp e profissionaliza a gestão de entregas.

### Três Módulos

| Módulo | Usuário | Função |
|---|---|---|
| **Central da Empresa** | Operador/gestor | Painel completo: pedidos, atendentes, entregas, financeiro, métricas |
| **App do Lojista** | Cliente da empresa de entregas | Solicitar, acompanhar e gerenciar entregas sem WhatsApp |
| **App do Motoboy** | Entregador | Gerenciar entregas, rotas, compartilhar localização em tempo real |

### IA Progressiva (diferencial)

1. **Acompanhamento inteligente** — monitora pedidos em tempo real, organiza operação, reduz erros
2. **Copiloto do atendente** — auxilia quem atende, sugere respostas, agiliza processos
3. **Agente autônomo (opcional)** — assume totalmente o atendimento remoto, 24h

O agente autônomo é produto adicional. O Chega.la funciona completo sem ele.

### Fora do Escopo deste Experimento

- **Landing page** — já existe e está no ar captando clientes
- O foco é construir o produto em si

## Referências Obrigatórias

| Recurso | Path | Uso |
|---|---|---|
| **Brand assets** | `.projeto/brainstoming/brand/` | Logomarca, cores, criativos. Usar SVGs — nunca texto ou ícone genérico. |
| **BRAND.md** | `.projeto/brainstoming/brand/BRAND.md` | Cores (Primary #222e6e, Secondary #1dace7, Accent #fca322), variantes de logo |
| **Documento Comercial** | `.projeto/brainstoming/documentos/chega.la.md` | Visão do produto, ecossistema, IA progressiva, público-alvo |
| **Landing Page doc** | `.projeto/brainstoming/documentos/LANDING_PAGE.md` | Dores do cliente, solução, funcionalidades, diferenciais |
| **Concorrente** | `.projeto/brainstoming/documentos/Concorrente - Entregas Expressas.md` | Referência do mercado, funcionalidades do concorrente |

## Público-Alvo

Empresas de entregas rápidas e logística que:
- Operam com lógica ponto A → ponto B (motoboys, veículos, etc.)
- Enfrentam gargalo do WhatsApp (atendentes digitando dados manualmente)
- Querem profissionalizar (sair de Excel e anotações manuais)
- Querem escalar sem inchar equipe

## Quando o Produto Está "Pronto"

Quando os três módulos funcionam juntos:
- Lojista cria pedido → backbone notifica central e motoboy via SSE
- Operador vê o pedido, atribui motoboy → motoboy recebe no app
- Motoboy aceita, coleta, entrega → posição em tempo real para todos
- Central acompanha tudo: pedidos, entregas, motoboys, financeiro

Tudo sincronizado em tempo real, sem polling. Com brand assets do Chega.la aplicados. Pronto para receber o primeiro cliente.
