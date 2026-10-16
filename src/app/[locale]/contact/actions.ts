"use server";

import { z } from "zod";
import { getCatalog } from "@/lib/data/catalog";
import {
  INCOTERMS,
  MAX_CUTS,
  PRESENTATIONS,
  PRODUCER_REASONS,
  VOLUME_LIMITS,
  VOLUME_UNITS,
  type VolumeUnit,
} from "@/lib/forms/contact-rules";
import { formLocale, insertSubmission, isBot, submittedValues, zodFieldErrors } from "@/lib/forms/server";
import type { FieldError, FormState } from "@/lib/forms/types";
import { DEPARTMENTS } from "@/lib/producers/livestock";

const trimmed = z.string().trim();
const required = (min: number, max: number) => trimmed.min(1, "required").min(min, "tooShort").max(max, "tooLong");
const optionalText = (max: number, min = 1) =>
  trimmed.max(max, "tooLong").refine((v) => v === "" || v.length >= min, "tooShort");
const phone = trimmed.regex(/^\+?[\d\s()-]{6,30}$/, "phone");
const oneOf = <T extends readonly string[]>(values: T) => trimmed.refine((v) => (values as readonly string[]).includes(v), "option");
const privacy = z.literal("on", { message: "privacy" });

// ─── Pedido de cotización → quote_requests ─────────────────────────────────

const QUOTE_FIELDS = [
  "company",
  "country",
  "contactName",
  "email",
  "phone",
  "presentation",
  "volumeAmount",
  "volumeUnit",
  "incoterm",
  "destinationPort",
  "message",
] as const;

const quoteSchema = z.object({
  company: required(2, 120),
  country: required(2, 80),
  contactName: required(2, 120),
  email: trimmed.min(1, "required").max(200, "tooLong").pipe(z.email("email")),
  phone: z.union([z.literal(""), phone]),
  presentation: oneOf(PRESENTATIONS),
  volumeAmount: trimmed.min(1, "required").regex(/^\d+$/, "integer").transform(Number),
  volumeUnit: oneOf(VOLUME_UNITS),
  incoterm: z.union([z.literal(""), oneOf(INCOTERMS)]),
  destinationPort: optionalText(80, 2),
  message: optionalText(2000),
  privacy,
});

/**
 * Cortes elegidos: al menos uno, como máximo MAX_CUTS y todos del catálogo. Aparte del schema
 * (como el volumen según la unidad): el error tiene que verse junto con los demás.
 */
async function cutsError(ids: string[], locale: Parameters<typeof getCatalog>[0]): Promise<FieldError | undefined> {
  if (ids.length === 0) return { code: "selectOne" };
  if (ids.length > MAX_CUTS) return { code: "tooMany", values: { max: MAX_CUTS } };
  const known = new Set((await getCatalog(locale)).cuts.map((c) => c.id));
  return ids.every((id) => known.has(id)) ? undefined : { code: "option" };
}

function volumeError(unit: string, amount: string): FieldError | undefined {
  if (!(VOLUME_UNITS as readonly string[]).includes(unit) || !/^\d+$/.test(amount.trim())) return undefined;
  const range = VOLUME_LIMITS[unit as VolumeUnit];
  const n = Number(amount);
  return n < range.min || n > range.max ? { code: "range", values: range } : undefined;
}

/**
 * "Pedir cotización". Clave publicable (anon solo inserta), sin .select(). Honeypot completo:
 * se responde éxito sin guardar. El límite lo aplica la base.
 */
export async function requestQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  const at = Date.now();
  if (isBot(formData)) return { status: "success", at };

  const locale = formLocale(formData);
  const cuts = [...new Set(formData.getAll("cuts").map(String))];
  const values = submittedValues(formData, QUOTE_FIELDS);
  const echo = { ...values, cuts: cuts.join(","), privacy: String(formData.get("privacy") ?? "") };

  const parsed = quoteSchema.safeParse({ ...values, privacy: formData.get("privacy") ?? undefined });
  const fieldErrors = parsed.success ? {} : zodFieldErrors(parsed.error);
  const cutsErr = await cutsError(cuts, locale);
  if (cutsErr) fieldErrors.cuts = cutsErr;
  const volume = volumeError(values.volumeUnit, values.volumeAmount);
  if (volume && !fieldErrors.volumeAmount) fieldErrors.volumeAmount = volume;
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", fieldErrors, values: echo, at };
  }

  const v = parsed.data;
  const status = await insertSubmission("quote_requests", locale, {
    company: v.company,
    contact_name: v.contactName,
    email: v.email,
    phone: v.phone || null,
    country: v.country,
    cut_ids: cuts,
    cuts_of_interest: cuts.join(", "),
    volume_amount: v.volumeAmount,
    volume_unit: v.volumeUnit,
    volume: `${v.volumeAmount} ${v.volumeUnit === "tonnes_month" ? "t/month" : "containers/month"}`,
    presentation: v.presentation,
    incoterm: v.incoterm || null,
    destination_port: v.destinationPort || null,
    message: v.message || null,
    privacy_accepted: true,
  });
  return status === "success" ? { status, at } : { status, values: echo, at };
}

// ─── Contacto de productores → producer_contacts ───────────────────────────

const PRODUCER_FIELDS = ["name", "phone", "department", "reason", "message"] as const;

const producerSchema = z.object({
  name: required(2, 120),
  phone: trimmed.min(1, "required").pipe(phone),
  department: oneOf(DEPARTMENTS),
  reason: oneOf(PRODUCER_REASONS),
  message: required(1, 2000),
  privacy,
});

/** Consulta de productores (vender hacienda, liquidación, otro). Mismas reglas que el resto. */
export async function contactProducer(_prev: FormState, formData: FormData): Promise<FormState> {
  const at = Date.now();
  if (isBot(formData)) return { status: "success", at };

  const locale = formLocale(formData);
  const values = submittedValues(formData, PRODUCER_FIELDS);
  const echo = { ...values, privacy: String(formData.get("privacy") ?? "") };
  const parsed = producerSchema.safeParse({ ...values, privacy: formData.get("privacy") ?? undefined });
  if (!parsed.success) return { status: "invalid", fieldErrors: zodFieldErrors(parsed.error), values: echo, at };

  const v = parsed.data;
  const status = await insertSubmission("producer_contacts", locale, {
    name: v.name,
    phone: v.phone,
    department: v.department,
    reason: v.reason,
    message: v.message,
    privacy_accepted: true,
  });
  return status === "success" ? { status, at } : { status, values: echo, at };
}
