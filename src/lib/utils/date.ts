import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { TIMEZONE } from "@/lib/constants";

function getNowInTimezone(): Date {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
}

export function todayInTimezone(): string {
  return format(getNowInTimezone(), "yyyy-MM-dd");
}

export function getDaysInMonth(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calStart, end: calEnd });
}

export function formatDate(date: Date, pattern: string): string {
  return format(date, pattern, { locale: ptBR });
}

export function isCurrentMonth(date: Date, reference: Date): boolean {
  return isSameMonth(date, reference);
}

export function isSelectedDay(date: Date, selected: Date | null): boolean {
  return selected ? isSameDay(date, selected) : false;
}

export function isDayToday(date: Date): boolean {
  return isToday(date);
}

export function isDayPast(date: Date): boolean {
  return isPast(date) && !isToday(date);
}

export function addMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function subMonth(date: Date): Date {
  return subMonths(date, 1);
}

export const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
