import { useEffect } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";

const sections = [
  { id: "login", title: "Como Fazer Login" },
  { id: "criar-pedido", title: "Criar Pedido" },
  { id: "enderecos", title: "Endereços Salvos" },
  { id: "acompanhar", title: "Acompanhar Pedido" },
  { id: "historico", title: "Histórico" },
  { id: "faturas", title: "Faturas" },
  { id: "pod", title: "Prova de Entrega" },
  { id: "faq", title: "Perguntas Frequentes" },
] as const;

const faqItems = [
  {
    q: "Quanto custa uma entrega?",
    a: "O valor depende da distância entre a coleta e o destino, de acordo com a tabela de preços definida pelo operador. Você pode ver o valor estimado ao criar o pedido.",
  },
  {
    q: "Quanto tempo demora uma entrega?",
    a: "O tempo varia conforme a disponibilidade de motoboys e a distância do trajeto. Você pode acompanhar o status em tempo real na tela de pedidos.",
  },
  {
    q: "Como cancelo um pedido?",
    a: "Pedidos com status pendente podem ser cancelados diretamente. Se a entrega já estiver em andamento, entre em contato com o operador para solicitar o cancelamento.",
  },
  {
    q: "Posso agendar uma entrega?",
    a: "No momento, as entregas são imediatas. Ao criar um pedido, ele é disponibilizado para os motoboys assim que confirmado.",
  },
  {
    q: "Como vejo a prova de entrega?",
    a: "No histórico de entregas, clique na entrega desejada e acesse a seção Prova de Entrega para ver a foto e a assinatura coletadas pelo motoboy.",
  },
  {
    q: "O endereço de coleta é sempre o da minha loja?",
    a: "Sim. O endereço de coleta é preenchido automaticamente com o endereço cadastrado da sua loja, facilitando a criação de pedidos.",
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
          Tudo o que você precisa saber para usar o painel do Lojista.
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
        {/* Login */}
        <section id="login">
          <h2 className="text-lg font-semibold mb-2">Como Fazer Login</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Para acessar o painel do Lojista, use o e-mail e senha fornecidos
              pelo operador da Central.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acesse a tela de login e insira seu e-mail e senha</li>
              <li>Caso esqueça a senha, entre em contato com o operador para redefinir</li>
            </ul>
          </div>
        </section>

        {/* Criar Pedido */}
        <section id="criar-pedido">
          <h2 className="text-lg font-semibold mb-2">Criar Pedido</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Para solicitar uma entrega, siga os passos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Clique em <strong>Nova Entrega</strong> no menu</li>
              <li>O endereço de coleta já vem preenchido com o endereço da sua loja</li>
              <li>Informe o endereço de destino (você pode usar um endereço salvo)</li>
              <li>Preencha os detalhes do pedido (descrição, referência)</li>
              <li>Confirme o pedido — ele será enviado para a Central</li>
            </ul>
            <p>
              Após a confirmação, o pedido fica disponível para atribuição a um motoboy.
            </p>
          </div>
        </section>

        {/* Endereços Salvos */}
        <section id="enderecos">
          <h2 className="text-lg font-semibold mb-2">Endereços Salvos</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Use endereços salvos para agilizar a criação de pedidos:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Favoritos</strong> — endereços que você salvou para uso frequente</li>
              <li><strong>Recentes</strong> — endereços usados nas últimas entregas, sugeridos automaticamente</li>
            </ul>
            <p>
              Ao criar um pedido, clique no campo de destino para ver as sugestões de endereços salvos.
            </p>
          </div>
        </section>

        {/* Acompanhar Pedido */}
        <section id="acompanhar">
          <h2 className="text-lg font-semibold mb-2">Acompanhar Pedido</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Acompanhe suas entregas em tempo real pela tela de Pedidos:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Status do pedido</strong> — veja se está pendente, aceito, em trânsito ou entregue</li>
              <li><strong>Mapa em tempo real</strong> — acompanhe a localização do motoboy durante a entrega</li>
              <li><strong>Detalhes</strong> — clique no pedido para ver informações completas</li>
            </ul>
          </div>
        </section>

        {/* Histórico */}
        <section id="historico">
          <h2 className="text-lg font-semibold mb-2">Histórico</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Consulte todas as entregas passadas na tela de Histórico:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Veja a lista de todas as entregas realizadas</li>
              <li>Use os filtros para buscar por data ou status</li>
              <li>Clique em uma entrega para ver os detalhes completos, incluindo a prova de entrega</li>
            </ul>
          </div>
        </section>

        {/* Faturas */}
        <section id="faturas">
          <h2 className="text-lg font-semibold mb-2">Faturas</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Acompanhe as cobranças das suas entregas:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Lista de faturas</strong> — veja todas as faturas geradas pelo operador</li>
              <li><strong>Detalhes</strong> — clique na fatura para ver os pedidos incluídos e valores</li>
              <li><strong>Períodos</strong> — as faturas são geradas com base no período de fechamento definido pelo operador</li>
            </ul>
          </div>
        </section>

        {/* Prova de Entrega */}
        <section id="pod">
          <h2 className="text-lg font-semibold mb-2">Prova de Entrega</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              A Prova de Entrega (POD) confirma que o pedido foi entregue com sucesso.
              Ela pode incluir:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Foto</strong> — imagem capturada pelo motoboy no momento da entrega</li>
              <li><strong>Assinatura</strong> — assinatura digital coletada do destinatário</li>
            </ul>
            <p>
              Para ver a prova de entrega, acesse o Histórico, clique na entrega desejada
              e veja a seção de comprovante.
            </p>
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
