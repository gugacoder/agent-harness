import {
  Package,
  User,
  Bike,
  Navigation,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

interface PostOrderModalProps {
  open: boolean;
  onClose: () => void;
}

interface TimelineState {
  icon: LucideIcon;
  title: string;
  description: string;
}

const timelineStates: TimelineState[] = [
  {
    icon: Package,
    title: "Pedido criado",
    description: "Seu pedido foi registrado no sistema",
  },
  {
    icon: User,
    title: "Motoboy atribuído",
    description: "O operador designa um motoboy para sua entrega",
  },
  {
    icon: Bike,
    title: "Coletando",
    description: "O motoboy está a caminho da sua loja",
  },
  {
    icon: Navigation,
    title: "A caminho",
    description: "O motoboy está levando o pedido ao destino",
  },
  {
    icon: CheckCircle,
    title: "Entregue",
    description: "Pedido entregue com sucesso!",
  },
];

export function PostOrderModal({ open, onClose }: PostOrderModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">O que acontece depois?</h2>

        {/* Vertical timeline */}
        <div className="mt-4 space-y-0">
          {timelineStates.map((state, index) => {
            const Icon = state.icon;
            const isLast = index === timelineStates.length - 1;

            return (
              <div key={state.title} className="flex">
                {/* Icon column with connecting line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div className="w-px grow bg-border" style={{ minHeight: 24 }} />
                  )}
                </div>

                {/* Text content */}
                <div className={`ml-3 ${isLast ? "pb-0" : "pb-4"}`}>
                  <p className="text-sm font-medium">{state.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {state.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanatory text */}
        <p className="mt-4 text-xs text-muted-foreground">
          Você acompanha tudo em tempo real no mapa.
        </p>

        {/* Entendi button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
