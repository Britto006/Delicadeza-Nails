// Normaliza um telefone brasileiro para dígitos com DDI 55 (formato do wa.me),
// ou retorna null se não for um número plausível. Aceita entrada com máscara.
//
// Aceita: 10 dígitos (DDD + fixo 8), 11 dígitos (DDD + celular 9), ou já com
// DDI 55 (12/13 dígitos). Rejeita qualquer outra coisa (lixo, número curto).
export function normalizeBrPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");

  // Já vem com DDI 55: 12 (fixo) ou 13 (celular).
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }
  // Sem DDI: 10 (fixo) ou 11 (celular) → prefixa 55.
  if (digits.length === 10 || digits.length === 11) {
    return "55" + digits;
  }
  return null;
}

export function isValidBrPhone(raw: string | null | undefined): boolean {
  return normalizeBrPhone(raw) !== null;
}
