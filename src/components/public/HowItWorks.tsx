import { CalendarDays, PencilLine, MessageCircle } from "lucide-react";

// Passo a passo factual do agendamento — reduz a insegurança de quem chega
// pela primeira vez (tráfego frio do Instagram) e deixa claro o próximo passo.
const steps = [
  {
    icon: CalendarDays,
    title: "Escolha o horário",
    desc: "Toque num dia com vaga e selecione o horário.",
  },
  {
    icon: PencilLine,
    title: "Deixe seus dados",
    desc: "Só nome e WhatsApp — sem cadastro nem senha.",
  },
  {
    icon: MessageCircle,
    title: "Confirme no WhatsApp",
    desc: "A confirmação é feita por lá. Pronto!",
  },
];

export function HowItWorks() {
  return (
    <section className="mt-6 rounded-2xl bg-card p-6 shadow-soft">
      <h2 className="mb-4 text-center font-serif text-lg text-primary">Como funciona</h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
