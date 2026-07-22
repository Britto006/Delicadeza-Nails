import { CalendarWrapper } from "@/components/public/CalendarWrapper";
import { generateDemoSlotsGrouped } from "@/lib/demo-data";

export default function Home() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-31`;
  const initialSlots = generateDemoSlotsGrouped(firstDay, lastDay);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-primary">
          Agende seu horário
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha o dia e horário disponível para agendar
        </p>
      </div>

      <CalendarWrapper initialSlots={initialSlots} />

      <div className="mt-4 flex items-center justify-center gap-4 rounded-xl bg-card p-3 shadow-soft">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-available" />
          Disponível
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-pending" />
          Pendente
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-booked" />
          Reservado
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-blocked" />
          Bloqueado
        </div>
      </div>
    </div>
  );
}
