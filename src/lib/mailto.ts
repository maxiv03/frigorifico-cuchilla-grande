/** mailto: con asunto marcado como demo. Sin dependencias de servidor (sirve en el cliente). */
export function buildMailto(email: string, subject: string) {
  const s = subject.startsWith("[Demo]") ? subject : `[Demo] ${subject}`;
  return `mailto:${email}?subject=${encodeURIComponent(s)}`;
}
