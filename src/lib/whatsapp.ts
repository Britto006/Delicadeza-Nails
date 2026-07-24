import { WHATSAPP_NUMBER, STUDIO_NAME } from "@/lib/constants";

export function generateWhatsAppMessage(
  date: string,
  time: string,
  clientName?: string
): string {
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}/${month}/${year}`;
  const greeting = clientName
    ? `Olá! Sou ${clientName} e acabei de reservar um horário no ${STUDIO_NAME}.`
    : `Olá! Gostaria de agendar um horário no ${STUDIO_NAME}.`;

  return (
    greeting +
    `\n\nData: ${formattedDate}` +
    `\nHorário: ${time}` +
    `\n\nPor favor, confirme a disponibilidade.` +
    `\n\nObrigada!`
  );
}

export function generateWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  if (isDesktopDevice()) {
    return `https://web.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function isDesktopDevice(): boolean {
  if (typeof window === "undefined") return true;
  const ua = navigator.userAgent;
  return !/android|iphone|ipad|ipod|mobile/i.test(ua);
}
