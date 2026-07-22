"use client";

import { useState, useCallback } from "react";
import { Calendar } from "@/components/public/Calendar";
import { DaySlotsModal } from "@/components/public/DaySlotsModal";
import type { TimeSlot } from "@/types/database";

interface CalendarWrapperProps {
  initialSlots: Record<string, TimeSlot[]>;
}

export function CalendarWrapper({ initialSlots }: CalendarWrapperProps) {
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    slots: TimeSlot[];
  } | null>(null);

  const handleDayClick = useCallback(
    (date: string, slots: TimeSlot[]) => {
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
      />
    </>
  );
}
