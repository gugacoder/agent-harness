import { useEffect } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";

const sections = [
  { id: "login", title: "Como Fazer Login" },
  { id: "status", title: "Status Online/Offline" },
  { id: "entregas", title: "Como Receber Entregas" },
  { id: "navegacao", title: "Como Navegar" },
  { id: "pod", title: "Prova de Entrega (POD)" },
  { id: "ganhos", title: "Seus Ganhos" },
  { id: "perfil", title: "Perfil" },
  { id: "problemas", title: "Problemas Comuns" },
  { id: "faq", title: "Perguntas Frequentes" },
] as const;

const troubleshootingRows = [
  {
    problema: "Não recebo entregas",
    causa: "Status offline ou GPS desativado",
    solucao: "Verificar toggle de status e permissão de localização",
  },
  {
    problema: "App não carrega",
    causa: "Sem conexão com internet",
    solucao: "Verificar WiFi/dados móveis",
  },
  {
    problema: "Localização imprecisa",
    causa: "GPS com baixa precisão",
    solucao: "Sair de ambiente fechado, aguardar calibração",
  },
  {
    problema: "Não consigo tirar foto",
    causa: "Permissão de câmera negada",
    solucao: "Configurações > Permissões > Câmera",
  },
];

const faqItems = [
  {
    q: "Quanto ganho por entrega?",
    a: "O valor depende da distância percorrida. Acesse a tab Extrato na barra inferior para ver o histórico detalhado dos seus ganhos.",
  },
  {
    q: "Posso recusar uma entrega?",
    a: "Sim. Ao receber a notificação de nova entrega, clique em Recusar. Você continuará disponível para receber outras entregas.",
  },
  {
    q: "E se o cliente não estiver no local?",
    a: "Entre em contato pelo telefone informado no pedido. Se não conseguir contato, aguarde no local e informe o operador.",
  },
  {
    q: "Como ativo minha localização?",
    a: "Acesse as Configurações do celular > Localização > Ativar. Certifique-se de que o app tem permissão para acessar a localização.",
  },
  {
    q: "O que acontece se eu ficar offline?",
    a: "Você para de receber novas entregas. Entregas já aceitas continuam normalmente. Para voltar a receber, ative o status online.",
  },
  {
    q: "Como vejo meu histórico de entregas?",
    a: "Toque na tab Histórico na barra inferior. Lá você vê todas as entregas realizadas, com data, endereço e valor.",
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Guia do Motoboy</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Tudo o que você precisa saber para fazer entregas com o Chega.la.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Índice</h2>
        <ul className="grid gap-1">
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
              O login é feito pelo WhatsApp usando código OTP (senha de uso único):
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Abra o app e informe seu número de telefone</li>
              <li>Você receberá um código de verificação no WhatsApp</li>
              <li>Digite o código no app para entrar</li>
            </ul>
            <p>
              O código expira em poucos minutos. Se não receber, verifique se o
              número está correto e tente novamente.
            </p>
          </div>
        </section>

        {/* Status */}
        <section id="status">
          <h2 className="text-lg font-semibold mb-2">Status Online/Offline</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Seu status controla se você recebe ou não novas entregas:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Online</strong> — você está disponível e recebe notificações de novas entregas</li>
              <li><strong>Offline</strong> — você não recebe novas entregas</li>
              <li><strong>Em entrega</strong> — você já está realizando uma entrega</li>
            </ul>
            <p>
              Para mudar seu status, acesse a tab Status na barra inferior e use
              o toggle. Fique online apenas quando estiver pronto para trabalhar.
            </p>
          </div>
        </section>

        {/* Entregas */}
        <section id="entregas">
          <h2 className="text-lg font-semibold mb-2">Como Receber Entregas</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Quando uma nova entrega é atribuída a você, uma notificação aparece
              no app:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Aceitar</strong> — confirma que você vai realizar a entrega</li>
              <li><strong>Recusar</strong> — a entrega é redirecionada para outro motoboy</li>
            </ul>
            <p>
              Após aceitar, você verá os detalhes da entrega: endereço de coleta,
              endereço de entrega e informações do pedido. Siga as instruções na
              tela para concluir.
            </p>
          </div>
        </section>

        {/* Navegação */}
        <section id="navegacao">
          <h2 className="text-lg font-semibold mb-2">Como Navegar</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              O app se integra com aplicativos de navegação do seu celular:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Toque no endereço de coleta ou entrega para abrir no Google Maps ou Waze</li>
              <li>O app de navegação vai traçar a melhor rota até o destino</li>
              <li>Ao chegar, volte ao app Chega.la para atualizar o status da entrega</li>
            </ul>
          </div>
        </section>

        {/* POD */}
        <section id="pod">
          <h2 className="text-lg font-semibold mb-2">Prova de Entrega (POD)</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Quando o operador exige comprovante de entrega, você precisa
              registrar a prova ao concluir:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Foto</strong> — tire uma foto do pacote entregue no local</li>
              <li><strong>Assinatura</strong> — peça ao destinatário para assinar na tela do celular</li>
            </ul>
            <p>
              Certifique-se de que a foto está nítida e a assinatura legível.
              Essas informações ficam salvas no pedido para consulta futura.
            </p>
          </div>
        </section>

        {/* Ganhos */}
        <section id="ganhos">
          <h2 className="text-lg font-semibold mb-2">Seus Ganhos</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Acompanhe seus ganhos pela tab Extrato na barra inferior:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Extrato</strong> — lista de entregas com o valor de cada uma</li>
              <li><strong>Períodos</strong> — agrupamento por período de fechamento</li>
              <li><strong>Cálculo</strong> — o valor é calculado com base na distância e na tabela de preços do operador</li>
            </ul>
            <p>
              O repasse é feito pelo operador após o fechamento do período.
            </p>
          </div>
        </section>

        {/* Perfil */}
        <section id="perfil">
          <h2 className="text-lg font-semibold mb-2">Perfil</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Para editar seus dados, toque no seu avatar no canto superior direito:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Nome</strong> — atualize seu nome de exibição</li>
              <li><strong>Telefone</strong> — altere seu número de contato</li>
              <li><strong>Foto</strong> — adicione ou mude sua foto de perfil</li>
            </ul>
          </div>
        </section>

        {/* Problemas Comuns */}
        <section id="problemas">
          <h2 className="text-lg font-semibold mb-3">Problemas Comuns</h2>
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-2 text-left font-medium">Problema</th>
                  <th className="px-3 py-2 text-left font-medium">Causa provável</th>
                  <th className="px-3 py-2 text-left font-medium">Solução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {troubleshootingRows.map((row, i) => (
                  <tr key={i} className="text-muted-foreground">
                    <td className="px-3 py-2 font-medium text-foreground">{row.problema}</td>
                    <td className="px-3 py-2">{row.causa}</td>
                    <td className="px-3 py-2">{row.solucao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
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
