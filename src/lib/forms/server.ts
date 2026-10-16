import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { z } from "zod";
import { routing, type Locale } from "@/i18n/routing";
import { runtimeEnv, serverEnv } from "@/lib/env";
import { publicDb } from "@/lib/supabase/public";
import { HONEYPOT_FIELD, type FieldError, type FieldErrorCode, type FormState } from "./types";

/**
 * Helpers de servidor para las Server Actions de formularios. Regla dura: el insert va con la
 * clave PUBLICABLE (rol anon, que solo tiene INSERT) y SIN `.select()`.
 */

/** Locale explícito (las Server Actions no tienen next/root-params). */
export function formLocale(formData: FormData): Locale {
  const v = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(v) ? (v as Locale) : routing.defaultLocale;
}

/** ¿Completó el campo trampa? Entonces es un bot: se responde "éxito" sin guardar nada. */
export function isBot(formData: FormData) {
  return String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "";
}

/** Valores de texto enviados (para devolverlos con los errores). Nunca el honeypot. */
export function submittedValues(formData: FormData, fields: readonly string[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
}

/** Errores de zod → código por campo (el primero de cada campo). */
export function zodFieldErrors(error: z.ZodError): Record<string, FieldError> {
  const out: Record<string, FieldError> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (!field || out[field]) continue;
    const params = (issue as { params?: Record<string, number | string> }).params;
    out[field] = { code: issue.message as FieldErrorCode, ...(params ? { values: params } : {}) };
  }
  return out;
}

/** sha256(IP + sal): permite limitar envíos por origen sin guardar la IP. */
async function ipHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${serverEnv().IP_HASH_SALT}`).digest("hex");
}

/**
 * Inserta una fila de formulario con la clave publicable. Agrega env, locale e ip_hash.
 * El límite de envíos lo aplica un trigger de la base (error "rate_limited").
 */
export async function insertSubmission(table: string, locale: Locale, row: Record<string, unknown>): Promise<FormState["status"]> {
  const { error } = await publicDb()
    .from(table)
    .insert({ ...row, env: runtimeEnv(), locale, ip_hash: await ipHash() });
  if (!error) return "success";
  if (error.message.includes("rate_limited")) return "rate_limited";
  console.error(`[forms] ${table}: ${error.code} ${error.message}`);
  return "error";
}
