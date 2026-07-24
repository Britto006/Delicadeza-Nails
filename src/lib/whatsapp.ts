import { WHATSAPP_NUMBER, STUDIO_NAME } from "@/lib/constants";
import { normalizeBrPhone } from "@/lib/utils/phone";

function formatBrDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

// Mensagem da CLIENTE para o estúdio (após reservar no site).
export function generateWhatsAppMessage(
  date: string,
  time: string,
  clientName?: string
): string {
  const greeting = clientName
    ? `Olá! Sou ${clientName} e acabei de reservar um horário no ${STUDIO_NAME}.`
    : `Olá! Gostaria de agendar um horário no ${STUDIO_NAME}.`;

  return (
    greeting +
    `\n\nData: ${formatBrDate(date)}` +
    `\nHorário: ${time}` +
    `\n\nPor favor, confirme a disponibilidade.` +
    `\n\nObrigada!`
  );
}

// Mensagem do ESTÚDIO para a cliente — confirmação da reserva.
export function generateConfirmationMessage(
  date: string,
  time: string,
  clientName?: string
): string {
  const oi = clientName ? `Oi, ${clientName}! ` : "Oi! ";
  return (
    `${oi}Aqui é do ${STUDIO_NAME}. Estou confirmando o seu horário! 💅` +
    `\n\nData: ${formatBrDate(date)}` +
    `\nHorário: ${time}` +
    `\n\nQual serviço você deseja fazer? Assim já deixo tudo prontinho pra você!`
  );
}

// Mensagem do ESTÚDIO para a cliente — lembrete (véspera).
export function generateReminderMessage(
  date: string,
  time: string,
  clientName?: string
): string {
  const oi = clientName ? `Oi, ${clientName}! ` : "Oi! ";
  return (
    `${oi}Passando pra lembrar do seu horário no ${STUDIO_NAME}. 😊` +
    `\n\nData: ${formatBrDate(date)}` +
    `\nHorário: ${time}` +
    `\n\nConsegue confirmar que vem? Se precisar remarcar, me avisa.`
  );
}

// Monta a URL do WhatsApp. Sem telefone destino → abre a conversa com o
// estúdio. Com telefone destino (ex: a dona mandando p/ a cliente) → abre a
// conversa com aquele número.
export function generateWhatsAppUrl(message: string, targetPhone?: string): string {
  const number = (targetPhone && normalizeBrPhone(targetPhone)) || WHATSAPP_NUMBER;
  const encoded = encodeURIComponent(message);
  if (isDesktopDevice()) {
    return `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`;
  }
  return `https://wa.me/${number}?text=${encoded}`;
}

export function isDesktopDevice(): boolean {
  if (typeof window === "undefined") return true;
  const ua = navigator.userAgent;
  return !/android|iphone|ipad|ipod|mobile/i.test(ua);
}
