"use client";

import { useState, useEffect } from "react";
import { CalendarWrapper } from "@/components/public/CalendarWrapper";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import type { TimeSlot } from "@/types/database";

export default function Home() {
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadSlots = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const firstDay = `${year}-${month}-01`;
      const lastDay = `${year}-${month}-31`;

      const { data } = await supabase
        .from("time_slots")
        .select("*")
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (data) {
        const grouped: Record<string, TimeSlot[]> = {};
        for (const slot of data) {
          if (!grouped[slot.date]) grouped[slot.date] = [];
          grouped[slot.date]!.push(slot);
        }
        setSlots(grouped);
      }
      setLoading(false);
    };

    loadSlots();
  }, [supabase]);

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

      <div className="mt-4 flex items-center justify-center gap-4 rounded-xl bg-card p-3 shadow-soft">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-available" /> Disponível
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-pending" /> Pendente
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-booked" /> Reservado
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-slot-blocked" /> Bloqueado
        </div>
      </div>
    </div>
  );
}
