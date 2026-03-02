# Regra: Production-Ready desde o Dia 1

## O Problema

Sistemas construídos com mocks, dados fake hardcoded e stubs criam dívida técnica desde o início. Quando chega a hora de substituir por código real, é preciso caçar mocks espalhados pelo sistema inteiro — em componentes, em services, em testes, em seeds. Isso é um inferno de manutenção e atrasa a entrega do produto real.

## A Regra

**Todo código escrito é production-ready.** Sem mocks inline, sem dados fake hardcoded, sem stubs que "depois a gente troca". Se uma feature precisa de dados, os dados vêm do banco. Se o banco precisa de dados, o seed fornece.

## Seeds, Não Mocks

Dois comandos de seed, dois propósitos:

| Comando | Ambiente | O que faz |
|---|---|---|
| `npm run db:seed` | Staging / Produção | Cadastros básicos reais: planos, permissões, configs padrão, dados essenciais para o sistema funcionar |
| `npm run db:seed:test` | Dev / Testes | Preenche a base com dados de teste completos: empresas, lojistas, motoboys, pedidos, entregas — tudo necessário para desenvolver e testar com a base cheia |

## Como Funciona na Prática

- **Precisa de uma empresa pra testar?** → `db:seed:test` cria empresas de teste com dados completos
- **Precisa de pedidos pra testar o fluxo?** → `db:seed:test` cria pedidos em vários estados (pending, assigned, picked_up, delivered)
- **Componente mostra lista vazia e quer ver com dados?** → `db:seed:test`, não hardcoded
- **Precisa de um plano de assinatura na base?** → `db:seed` (dado real, necessário em produção também)

## O que É Proibido

- Dados mock hardcoded em componentes, services ou hooks
- Arrays fake inline (`const orders = [{ id: 1, name: 'Teste' }]`)
- Stubs de API que retornam JSON fixo
- Qualquer dado que exista só no código e não no banco

## O que É Permitido

- `db:seed:test` com dados de teste ricos e realistas
- `db:seed` com dados base de produção
- Factories/fixtures para testes automatizados (dentro do contexto de teste, não no app)

## Justificativa

O esforço de criar um seed de teste completo é feito **uma vez**. O esforço de caçar e substituir mocks espalhados pelo sistema é feito **toda vez que algo muda**. O seed é investimento. O mock é dívida.
