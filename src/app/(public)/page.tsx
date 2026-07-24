import { connection } from "next/server";
import { CalendarWrapper } from "@/components/public/CalendarWrapper";
import { HomeError } from "@/components/public/HomeError";
import { HowItWorks } from "@/components/public/HowItWorks";
import { SocialProof } from "@/components/public/SocialProof";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone, toLocalDateString, parseDateString } from "@/lib/utils/date";
import type { PublicTimeSlot, BlockedDay } from "@/types/database";

export default async function Home() {
  // Dados mudam a cada reserva: renderização sempre dinâmica (Next 16
  // recomenda connection() em vez de dynamic = "force-dynamic").
  await connection();

  const supabase = await createClient();
  const firstDay = todayInTimezone();

  const future = parseDateString(firstDay);
  future.setMonth(future.getMonth() + 3);
  const lastDay = toLocalDateString(future);

  // Colunas explícitas: anon não tem grant nas colunas de PII (client_name etc.)
  const [slotsResult, configResult] = await Promise.all([
    supabase
      .from("time_slots")
      .select("id, date, start_time, end_time, status")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase.from("studio_config").select("blocked_days").limit(1).single(),
  ]);

  let content: React.ReactNode;

  if (slotsResult.error) {
    console.error("Erro ao buscar horários:", slotsResult.error.message);
    content = <HomeError />;
  } else {
    // Dias bloqueados nas configurações não aparecem no calendário público.
    const blockedDays = (configResult.data?.blocked_days ?? []) as BlockedDay[];
    const blockedDates = new Set(blockedDays.map((b) => b.date));

    const grouped: Record<string, PublicTimeSlot[]> = {};
    for (const slot of slotsResult.data ?? []) {
      const key = String(slot.date);
      if (blockedDates.has(key)) continue;
      if (!grouped[key]) grouped[key] = [];
      grouped[key]!.push(slot);
    }

    content = <CalendarWrapper initialSlots={grouped} />;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-primary">Agende seu horário</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o dia e horário disponível para agendar</p>
      </div>

      {content}

      <div className="mt-4 flex items-center justify-center rounded-xl bg-card p-3 shadow-soft">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-available" /> Dias com horários disponíveis
        </div>
      </div>

      <HowItWorks />
      <SocialProof />
    </div>
  );
}
