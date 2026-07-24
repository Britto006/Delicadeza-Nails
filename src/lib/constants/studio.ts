export const STUDIO_NAME = "Delicadeza Nails";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5531989291910";
export const TIMEZONE = "America/Sao_Paulo";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Depoimentos de clientes REAIS. Mantido vazio de propósito — só adicione
// depoimentos verdadeiros (avaliações inventadas enganam clientes e podem dar
// problema). Para exibir na home, adicione itens: { name: "Nome", text: "..." }
export const TESTIMONIALS: { name: string; text: string }[] = [];
