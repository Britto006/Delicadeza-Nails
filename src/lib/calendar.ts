import { STUDIO_NAME, TIMEZONE } from "@/lib/constants";

// Gera links de "adicionar à agenda" sem backend, para a cliente criar seu
// próprio lembrete (alavanca anti-falta gratuita). Não depende de SMS/e-mail.

export interface CalendarEvent {
  date: string; // "yyyy-MM-dd"
  startTime: string; // "HH:MM" ou "HH:MM:SS"
  endTime: string;
}

// "2026-07-29" + "09:00:00" -> "20260729T090000" (horário local, sem UTC)
function toStamp(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  const [hh = "00", mm = "00"] = time.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function fields(e: CalendarEvent) {
  return {
    title: `Horário — ${STUDIO_NAME}`,
    details: `Seu horário no ${STUDIO_NAME}. Não esqueça de confirmar pelo WhatsApp. :)`,
    start: toStamp(e.date, e.startTime),
    end: toStamp(e.date, e.endTime),
  };
}

// Link do Google Agenda. ctz fixa o fuso do estúdio (America/Sao_Paulo).
export function buildGoogleCalendarUrl(e: CalendarEvent): string {
  const { title, details, start, end } = fields(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
    ctz: TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Arquivo .ics como data URI — iOS/Android/Outlook abrem nativamente.
// Horário "flutuante" (sem TZID/UTC): o app trata como hora local do aparelho,
// o que é correto para uma cliente na mesma região do estúdio.
export function buildIcsDataUri(e: CalendarEvent): string {
  const { title, details, start, end } = fields(e);
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Delicadeza Nails//Agendamento//PT-BR",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
