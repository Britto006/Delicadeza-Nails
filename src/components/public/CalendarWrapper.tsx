"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/public/Calendar";
import { DaySlotsModal } from "@/components/public/DaySlotsModal";
import type { PublicTimeSlot } from "@/types/database";

interface CalendarWrapperProps {
  initialSlots: Record<string, PublicTimeSlot[]>;
}

export function CalendarWrapper({ initialSlots }: CalendarWrapperProps) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    slots: PublicTimeSlot[];
  } | null>(null);

  const handleDayClick = useCallback(
    (date: string, slots: PublicTimeSlot[]) => {
      setSelectedDay({ date, slots });
    },
    []
  );

  // Após reservar, recarrega os dados do servidor: o slot some do calendário.
  const handleBooked = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <Calendar onDayClick={handleDayClick} initialSlots={initialSlots} />

      <DaySlotsModal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        date={selectedDay?.date ?? null}
        slots={selectedDay?.slots ?? []}
        onBooked={handleBooked}
      />
    </>
  );
}
