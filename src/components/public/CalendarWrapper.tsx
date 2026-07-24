"use client";

import { useState, useCallback } from "react";
import { Calendar } from "@/components/public/Calendar";
import { DaySlotsModal } from "@/components/public/DaySlotsModal";
import type { PublicTimeSlot } from "@/types/database";

interface CalendarWrapperProps {
  initialSlots: Record<string, PublicTimeSlot[]>;
  onBooked: () => void;
}

export function CalendarWrapper({ initialSlots, onBooked }: CalendarWrapperProps) {
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

  return (
    <>
      <Calendar onDayClick={handleDayClick} initialSlots={initialSlots} />

      <DaySlotsModal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        date={selectedDay?.date ?? null}
        slots={selectedDay?.slots ?? []}
        onBooked={onBooked}
      />
    </>
  );
}
