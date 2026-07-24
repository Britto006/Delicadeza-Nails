"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarWrapper } from "@/components/public/CalendarWrapper";
import { ErrorState } from "@/components/ui/ErrorState";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/utils/date";
import type { PublicTimeSlot } from "@/types/database";

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [slots, setSlots] = useState<Record<string, PublicTimeSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const firstDay = todayInTimezone();

    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    const lastDay = toLocalDateString(future);

    // Colunas explícitas: anon não tem grant nas colunas de PII (client_name etc.)
    const { data, error: queryError } = await supabase
      .from("time_slots")
      .select("id, date, start_time, end_time, status")
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (queryError) {
      console.error("Erro ao buscar horários:", queryError.message);
      setError("Não foi possível carregar os horários. Tente novamente.");
      setLoading(false);
      return;
    }

    const grouped: Record<string, PublicTimeSlot[]> = {};
    for (const slot of data ?? []) {
      const key = String(slot.date);
      if (!grouped[key]) grouped[key] = [];
      grouped[key]!.push(slot);
    }
    setSlots(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-primary">Agende seu horário</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o dia e horário disponível para agendar</p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-card p-6 shadow-medium">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-card p-6 shadow-medium">
          <ErrorState message={error} onRetry={loadSlots} />
        </div>
      ) : (
        <CalendarWrapper initialSlots={slots} onBooked={loadSlots} />
      )}

      <div className="mt-4 flex items-center justify-center rounded-xl bg-card p-3 shadow-soft">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-available" /> Dias com horários disponíveis
        </div>
      </div>
    </div>
  );
}
