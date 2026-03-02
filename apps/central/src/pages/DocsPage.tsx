import { useEffect } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";

const sections = [
  { id: "visao-geral", title: "Visão Geral" },
  { id: "primeiro-acesso", title: "Primeiro Acesso" },
  { id: "dashboard", title: "Dashboard" },
  { id: "pedidos", title: "Gestão de Pedidos" },
  { id: "motoboys", title: "Gestão de Motoboys" },
  { id: "lojas", title: "Gestão de Lojas" },
  { id: "mapa", title: "Mapa" },
  { id: "precos", title: "Preços" },
  { id: "financeiro", title: "Financeiro" },
  { id: "faturas", title: "Faturas" },
  { id: "analytics", title: "Analytics" },
  { id: "configuracao", title: "Configuração" },
  { id: "faq", title: "Perguntas Frequentes" },
] as const;

const faqItems = [
  {
    q: "Motoboy não aparece no mapa?",
    a: "Verifique se o motoboy está com status online e com GPS ativo no celular. A localização só é enviada enquanto o entregador está online.",
  },
  {
    q: "Como exportar faturas?",
    a: "Acesse o menu Faturas, selecione a fatura desejada e clique no botão Exportar PDF.",
  },
  {
    q: "Como mudar o preço das entregas?",
    a: "Acesse o menu Preços e edite as regras da tabela de preços ativa.",
  },
  {
    q: "Como cadastrar um novo motoboy?",
    a: "Acesse o menu Motoboys e clique no botão Novo Motoboy. Preencha os dados e salve.",
  },
  {
    q: "O que é POD?",
    a: "POD é a Prova de Entrega. Consiste em uma foto e assinatura coletados pelo motoboy no momento da entrega, confirmando que o pedido foi recebido.",
  },
  {
    q: "Como funciona o fechamento financeiro?",
    a: "Acesse o menu Financeiro, selecione o período desejado e clique em Confirmar. Depois de revisado, marque como Pago para registrar o repasse.",
  },
  {
    q: "Posso ter mais de uma tabela de preços?",
    a: "Sim, você pode criar várias tabelas de preços, mas apenas uma fica ativa por vez. As outras ficam salvas para uso futuro.",
  },
  {
    q: "Como reexecutar o wizard de configuração?",
    a: "Acesse o menu Configurações e clique em Reexecutar configuração inicial. O wizard vai guiar você novamente pelas etapas de setup.",
  },
];

function scrollToHash() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const el = document.getElementById(hash);
    el?.scrollIntoView({ behavior: "smooth" });
  }
}

export function DocsPage() {
  useEffect(() => {
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Guia de Uso</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Tudo o que você precisa saber para operar a Central de entregas.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Índice</h2>
        <ul className="grid gap-1 sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-primary hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      <div className="space-y-10">
        {/* Visão Geral */}
        <section id="visao-geral">
          <h2 className="text-lg font-semibold mb-2">Visão Geral</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              A Central é o painel de controle do operador de entregas. Por aqui você gerencia
              motoboys, lojas, pedidos, preços e financeiro — tudo em um só lugar.
            </p>
            <p>
              O fluxo funciona assim: a loja cria um pedido, a Central distribui para um motoboy
              disponível, e você acompanha tudo em tempo real pelo mapa e pelos status dos pedidos.
            </p>
          </div>
        </section>

        {/* Primeiro Acesso */}
        <section id="primeiro-acesso">
          <h2 className="text-lg font-semibold mb-2">Primeiro Acesso</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              No primeiro login, um wizard de configuração vai guiar você pelas etapas iniciais:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dados da empresa (nome, CNPJ, endereço)</li>
              <li>Configuração de preços (tabela inicial)</li>
              <li>Ativação do comprovante de entrega (POD)</li>
              <li>Período de fechamento financeiro</li>
            </ul>
            <p>
              Você pode reexecutar o wizard a qualquer momento pelo menu Configurações.
            </p>
          </div>
        </section>

        {/* Dashboard */}
        <section id="dashboard">
          <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              O Dashboard mostra um resumo da operação em tempo real. As métricas incluem:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Pedidos ativos</strong> — entregas em andamento neste momento</li>
              <li><strong>Entregas hoje</strong> — total de entregas concluídas no dia</li>
              <li><strong>Motoboys online</strong> — entregadores disponíveis agora</li>
              <li><strong>Tempo médio</strong> — duração média das entregas recentes</li>
            </ul>
            <p>
              Abaixo das métricas você vê a lista de pedidos ativos e o mapa com a localização dos
              motoboys online.
            </p>
          </div>
        </section>

        {/* Pedidos */}
        <section id="pedidos">
          <h2 className="text-lg font-semibold mb-2">Gestão de Pedidos</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Na tela de Pedidos você pode:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Criar pedido</strong> — clique em Novo Pedido, preencha origem, destino e detalhes</li>
              <li><strong>Atribuir motoboy</strong> — selecione um entregador disponível para o pedido</li>
              <li><strong>Acompanhar status</strong> — veja o progresso (pendente, aceito, em trânsito, entregue)</li>
              <li><strong>Ver detalhes</strong> — clique em qualquer pedido para ver informações completas</li>
            </ul>
            <p>
              Os pedidos também podem ser criados pelas lojas parceiras pelo app Lojista.
            </p>
          </div>
        </section>

        {/* Motoboys */}
        <section id="motoboys">
          <h2 className="text-lg font-semibold mb-2">Gestão de Motoboys</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Aqui você gerencia seus entregadores:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cadastrar</strong> — clique em Novo Motoboy, informe nome, telefone e dados</li>
              <li><strong>Monitorar status</strong> — veja quem está online, offline ou em entrega</li>
              <li><strong>Histórico</strong> — acesse o perfil de cada motoboy para ver entregas realizadas</li>
            </ul>
          </div>
        </section>

        {/* Lojas */}
        <section id="lojas">
          <h2 className="text-lg font-semibold mb-2">Gestão de Lojas</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Gerencie as lojas parceiras que utilizam o serviço de entregas:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cadastrar loja</strong> — clique em Nova Loja, preencha nome, endereço e contato</li>
              <li><strong>Editar dados</strong> — acesse o perfil da loja para atualizar informações</li>
              <li><strong>Ver pedidos</strong> — no perfil da loja, veja todos os pedidos feitos por ela</li>
            </ul>
          </div>
        </section>

        {/* Mapa */}
        <section id="mapa">
          <h2 className="text-lg font-semibold mb-2">Mapa</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              O mapa mostra a localização em tempo real de todos os motoboys online. A posição é
              atualizada automaticamente enquanto o entregador está com o app aberto.
            </p>
            <p>
              <strong>Por que um motoboy pode não aparecer?</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ele está com status offline</li>
              <li>O GPS do celular está desativado</li>
              <li>O app do motoboy está fechado ou sem conexão</li>
            </ul>
          </div>
        </section>

        {/* Preços */}
        <section id="precos">
          <h2 className="text-lg font-semibold mb-2">Preços</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Configure como as entregas são cobradas:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Tabela de preços</strong> — defina valores por faixa de distância</li>
              <li><strong>Simulador</strong> — teste quanto custaria uma entrega antes de aplicar</li>
              <li><strong>Sobretaxas por loja</strong> — configure preços diferenciados para lojas específicas</li>
            </ul>
            <p>
              Apenas uma tabela de preços fica ativa por vez. Você pode criar outras e trocar quando quiser.
            </p>
          </div>
        </section>

        {/* Financeiro */}
        <section id="financeiro">
          <h2 className="text-lg font-semibold mb-2">Financeiro</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Controle os repasses aos motoboys:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Selecionar período</strong> — escolha o intervalo de datas para o fechamento</li>
              <li><strong>Confirmar fechamento</strong> — revise os valores e confirme</li>
              <li><strong>Marcar como pago</strong> — depois do repasse, marque como pago para registro</li>
            </ul>
          </div>
        </section>

        {/* Faturas */}
        <section id="faturas">
          <h2 className="text-lg font-semibold mb-2">Faturas</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Gerencie as cobranças das lojas parceiras:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Gerar fatura</strong> — crie uma fatura para uma loja com base nos pedidos do período</li>
              <li><strong>Enviar</strong> — encaminhe a fatura para a loja</li>
              <li><strong>Exportar PDF</strong> — baixe a fatura em formato PDF</li>
            </ul>
          </div>
        </section>

        {/* Analytics */}
        <section id="analytics">
          <h2 className="text-lg font-semibold mb-2">Analytics</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Acompanhe o desempenho da operação:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Tendência de entregas</strong> — gráfico com volume de entregas ao longo do tempo</li>
              <li><strong>Desempenho dos motoboys</strong> — ranking de entregadores por entregas e tempo médio</li>
              <li><strong>Volume por bairro</strong> — quais regiões concentram mais entregas</li>
            </ul>
            <p>
              Use os filtros de período para analisar intervalos específicos.
            </p>
          </div>
        </section>

        {/* Configuração */}
        <section id="configuracao">
          <h2 className="text-lg font-semibold mb-2">Configuração</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Ajuste os parâmetros da sua operação:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>POD obrigatório</strong> — quando ativado, motoboys devem enviar foto e assinatura ao entregar</li>
              <li><strong>Período de fechamento</strong> — define a frequência dos fechamentos financeiros</li>
              <li><strong>Reexecutar wizard</strong> — refaça a configuração inicial caso precise ajustar dados da empresa</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <h2 className="text-lg font-semibold mb-3">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border bg-card shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent transition-colors rounded-lg">
                  {item.q}
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-4 pb-3 text-sm text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
