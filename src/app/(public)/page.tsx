"use client";

import { useState, useEffect } from "react";
import { CalendarWrapper } from "@/components/public/CalendarWrapper";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/utils/date";
import type { TimeSlot } from "@/types/database";

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSlots = async () => {
      const supabase = createClient();
      const firstDay = todayInTimezone();

      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      const lastDay = toLocalDateString(future);

      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Erro ao buscar horários:", error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const grouped: Record<string, TimeSlot[]> = {};
        for (const slot of data) {
          const key = String(slot.date);
          if (!grouped[key]) grouped[key] = [];
          grouped[key]!.push(slot);
        }
        setSlots(grouped);
      }
      setLoading(false);
    };

    loadSlots();
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-primary">Agende seu horário</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o dia e horário disponível para agendar</p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-card p-6 shadow-medium">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <CalendarWrapper initialSlots={slots} />
      )}

      <div className="mt-4 flex items-center justify-center rounded-xl bg-card p-3 shadow-soft">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-available" /> Dias com horários disponíveis
        </div>
      </div>
    </div>
  );
}
