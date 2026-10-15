import "server-only";
import { serverEnv } from "@/lib/env";
import { buildMailto } from "@/lib/mailto";

/** Datos de contacto demo (teléfono/WhatsApp y mail del equipo, desde variables de entorno). */
export function contactInfo() {
  const { WHATSAPP_NUMBER, CONTACT_EMAIL } = serverEnv();
  return {
    email: CONTACT_EMAIL,
    phoneE164: `+${WHATSAPP_NUMBER}`,
    phoneDisplay: formatPhone(WHATSAPP_NUMBER),
  };
}

/** "59898016286" → "+598 98 016 286" (celular uruguayo); otros formatos quedan con "+" y espacios mínimos. */
export function formatPhone(digits: string) {
  const uy = digits.match(/^598(9\d)(\d{3})(\d{3})$/);
  if (uy) return `+598 ${uy[1]} ${uy[2]} ${uy[3]}`;
  return `+${digits}`;
}

/**
 * Link de WhatsApp con mensaje prellenado. El texto viene traducido de next-intl y
 * debe empezar con "[Demo]" (se fuerza acá por si una traducción lo omite).
 */
export function whatsappUrl(message: string) {
  const { WHATSAPP_NUMBER } = serverEnv();
  const text = message.startsWith("[Demo]") ? message : `[Demo] ${message}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/** mailto: con asunto prellenado (también marcado como demo). */
export function mailtoUrl(subject: string) {
  return buildMailto(serverEnv().CONTACT_EMAIL, subject);
}
