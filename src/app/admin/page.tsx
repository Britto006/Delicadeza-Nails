import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import {
  todayInTimezone,
  parseDateString,
  toLocalDateString,
  formatDate,
} from "@/lib/utils/date";
import { Clock, CalendarClock, CalendarCheck, CalendarDays } from "lucide-react";

// Painel inicial do admin: visão geral das reservas. Server component — lê
// direto do banco (o admin autenticado tem acesso via RLS).
export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = todayInTimezone();

  const tomorrowD = parseDateString(today);
  tomorrowD.setDate(tomorrowD.getDate() + 1);
  const tomorrow = toLocalDateString(tomorrowD);

  const monthStart = `${today.slice(0, 7)}-01`;
  const [y, m] = today.split("-").map(Number);
  const monthEnd = `${today.slice(0, 7)}-${String(new Date(y!, m!, 0).getDate()).padStart(2, "0")}`;

  const sevenD = parseDateString(today);
  sevenD.setDate(sevenD.getDate() + 6);
  const sevenEnd = toLocalDateString(sevenD);

  const [pending, bookedMonth, availableFuture, tomorrowCount, next7] = await Promise.all([
    supabase.from("time_slots").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("time_slots").select("*", { count: "exact", head: true }).eq("status", "booked").gte("date", monthStart).lte("date", monthEnd),
    supabase.from("time_slots").select("*", { count: "exact", head: true }).eq("status", "available").gte("date", today),
    supabase.from("time_slots").select("*", { count: "exact", head: true }).in("status", ["pending", "booked"]).eq("date", tomorrow),
    supabase.from("time_slots").select("date, status").in("status", ["pending", "booked"]).gte("date", today).lte("date", sevenEnd),
  ]);

  // Agrupa reservas dos próximos 7 dias para um gráfico simples.
  const rows = (next7.data ?? []) as { date: string; status: string }[];
  const days: { ds: string; label: string; day: string; count: number }[] = [];
  const cursor = parseDateString(today);
  for (let i = 0; i < 7; i++) {
    const ds = toLocalDateString(cursor);
    days.push({
      ds,
      label: formatDate(new Date(ds + "T12:00:00"), "EEE"),
      day: formatDate(new Date(ds + "T12:00:00"), "dd/MM"),
      count: rows.filter((r) => String(r.date) === ds).length,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  const stats = [
    { label: "Pendentes agora", value: pending.count ?? 0, icon: Clock },
    { label: "Amanhã", value: tomorrowCount.count ?? 0, icon: CalendarClock },
    { label: "Confirmadas no mês", value: bookedMonth.count ?? 0, icon: CalendarCheck },
    { label: "Horários livres", value: availableFuture.count ?? 0, icon: CalendarDays },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-foreground">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas reservas</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 font-serif text-lg text-foreground">Reservas nos próximos 7 dias</h2>
        <div className="flex items-end justify-between gap-2">
          {days.map((d) => (
            <div key={d.ds} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-foreground">{d.count || ""}</span>
              <div className="flex w-full items-end justify-center" style={{ height: 90 }}>
                <div
                  className="w-full max-w-8 rounded-t bg-primary/70"
                  style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count ? 6 : 0 }}
                />
              </div>
              <span className="text-[10px] capitalize text-muted-foreground">{d.label}</span>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
