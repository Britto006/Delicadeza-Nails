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

// Serializa um Date local como "yyyy-MM-dd" sem passar por UTC.
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Interpreta "yyyy-MM-dd" como data local (new Date("yyyy-MM-dd") seria UTC
// e, em UTC-3, cairia no dia anterior).
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
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

// Comparações contra o "hoje" do estúdio (America/Sao_Paulo), não do visitante.
export function isDayToday(date: Date): boolean {
  return toLocalDateString(date) === todayInTimezone();
}

export function isDayPast(date: Date): boolean {
  return toLocalDateString(date) < todayInTimezone();
}

export function addMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function subMonth(date: Date): Date {
  return subMonths(date, 1);
}

export const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
