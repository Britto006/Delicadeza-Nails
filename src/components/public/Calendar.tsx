"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  getDaysInMonth,
  formatDate,
  isCurrentMonth,
  isDayToday,
  isDayPast,
  weekDaysShort,
  addMonth,
  subMonth,
} from "@/lib/utils/date";
import type { PublicTimeSlot } from "@/types/database";

interface CalendarProps {
  onDayClick: (date: string, slots: PublicTimeSlot[]) => void;
  initialSlots: Record<string, PublicTimeSlot[]>;
}

export function Calendar({ onDayClick, initialSlots }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allSlots] = useState(initialSlots);

  const days = getDaysInMonth(currentDate);

  const handlePrevMonth = () => setCurrentDate((d) => subMonth(d));
  const handleNextMonth = () => setCurrentDate((d) => addMonth(d));

  const getDaySlots = (day: Date): PublicTimeSlot[] => {
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    return allSlots[dateStr] ?? [];
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-medium">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h2 className="font-serif text-xl text-foreground">
          {formatDate(currentDate, "MMMM 'de' yyyy")}
        </h2>

        <button
          onClick={handleNextMonth}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekDaysShort.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const slots = getDaySlots(day);
          const availableCount = slots.filter(
            (s) => s.status === "available"
          ).length;
          const inMonth = isCurrentMonth(day, currentDate);
          const past = isDayPast(day);

          return (
            <button
              key={i}
              onClick={() => {
                if (!past && inMonth && availableCount > 0) {
                  const y = day.getFullYear();
                  const m = String(day.getMonth() + 1).padStart(2, "0");
                  const dd = String(day.getDate()).padStart(2, "0");
                  onDayClick(`${y}-${m}-${dd}`, slots);
                }
              }}
              disabled={past || !inMonth || availableCount === 0}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                !inMonth && "text-muted-foreground/30",
                inMonth && !past && "text-foreground hover:bg-muted hover:shadow-soft",
                past && "text-muted-foreground/40",
                isDayToday(day) && "ring-2 ring-primary ring-offset-1",
                availableCount > 0 && !past && "cursor-pointer",
                availableCount === 0 && inMonth && !past && "cursor-default"
              )}
            >
              <span className="text-sm font-medium">
                {formatDate(day, "d")}
              </span>
              {availableCount > 0 && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slot-available" />
              )}
              {availableCount === 0 && inMonth && !past && slots.length > 0 && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-slot-blocked" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
