export function normalizeWhatsApp(input: string): string {
  let value = input.trim().replace(/[\s().-]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  if (/^0[67]\d{8}$/.test(value)) value = `+212${value.slice(1)}`;
  if (!/^\+[1-9]\d{7,14}$/.test(value))
    throw Error(
      "Saisis un numéro WhatsApp valide, par exemple +212 6 12 34 56 78.",
    );
  return value;
}

export function whatsappURL(number: string, message?: string): string {
  return `https://wa.me/${normalizeWhatsApp(number).slice(1)}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
