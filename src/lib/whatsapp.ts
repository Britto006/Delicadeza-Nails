import { WHATSAPP_NUMBER, STUDIO_NAME } from "@/lib/constants";

export function generateWhatsAppMessage(date: string, time: string): string {
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}/${month}/${year}`;

  return (
    `Olá! Gostaria de agendar um horário no ${STUDIO_NAME}.` +
    `\n\nData: ${formattedDate}` +
    `\nHorário: ${time}` +
    `\n\nPor favor, confirme a disponibilidade.` +
    `\n\nObrigada!`
  );
}

export function generateWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function isDesktopDevice(): boolean {
  if (typeof window === "undefined") return true;
  const ua = navigator.userAgent;
  return !/android|iphone|ipad|ipod|mobile/i.test(ua);
}
