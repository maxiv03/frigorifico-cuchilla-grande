"use server";

import { z } from "zod";
import { formLocale, insertSubmission, isBot, submittedValues, zodFieldErrors } from "@/lib/forms/server";
import type { FieldError, FormState } from "@/lib/forms/types";
import {
  addDays,
  AVAILABLE_WITHIN_DAYS,
  CATEGORY_IDS,
  CATEGORY_SPECIES,
  DEPARTMENTS,
  HEADS,
  isCategory,
  LIMITS,
  todayUy,
} from "@/lib/producers/livestock";

const FIELDS = ["category", "headCount", "avgWeight", "breed", "department", "availableFrom", "name", "phone", "email", "notes"] as const;
/** Lo que se devuelve para volver a llenar el formulario (incluye la casilla de privacidad). */
const ECHO = [...FIELDS, "privacy"] as const;

const trimmed = z.string().trim();
const optionalText = (max: number, min = 1) =>
  trimmed.max(max, "tooLong").refine((v) => v === "" || v.length >= min, "tooShort");
const int = (range: { min: number; max: number }) =>
  trimmed
    .min(1, "required")
    .regex(/^\d+$/, "integer")
    .transform(Number)
    .refine((n) => n >= range.min && n <= range.max, { message: "range", params: range });

function schema() {
  const today = todayUy();
  const last = addDays(today, AVAILABLE_WITHIN_DAYS);
  return z
    .object({
      category: trimmed.refine((v) => (CATEGORY_IDS as string[]).includes(v), "option"),
      headCount: int(HEADS),
      avgWeight: trimmed.min(1, "required").regex(/^\d+$/, "integer").transform(Number),
      breed: optionalText(60, 2),
      department: trimmed.refine((v) => (DEPARTMENTS as readonly string[]).includes(v), "option"),
      availableFrom: trimmed
        .min(1, "required")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "date")
        .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "date")
        .refine((v) => v >= today && v <= last, { message: "dateRange", params: { from: today, to: last } }),
      name: trimmed.min(1, "required").min(2, "tooShort").max(120, "tooLong"),
      phone: trimmed.min(1, "required").regex(/^\+?[\d\s()-]{6,30}$/, "phone"),
      email: trimmed.max(200, "tooLong").refine((v) => v === "" || z.email().safeParse(v).success, "email"),
      notes: optionalText(2000),
      privacy: z.literal("on", { message: "privacy" }),
    });
}

/**
 * Peso razonable según la especie de la categoría. Va aparte del schema: zod no corre los
 * refinamientos del objeto si otro campo ya falló, y el error tiene que verse junto con los demás.
 */
function weightError(category: string, avgWeight: string): FieldError | undefined {
  if (!isCategory(category) || !/^\d+$/.test(avgWeight.trim())) return undefined;
  const range = LIMITS[CATEGORY_SPECIES[category]].weight;
  const n = Number(avgWeight);
  return n < range.min || n > range.max ? { code: "range", values: range } : undefined;
}

/**
 * "Ofrecer ganado" → livestock_offers. Clave publicable (anon solo inserta), sin .select().
 * Honeypot completo: se responde éxito sin guardar. El límite lo aplica la base.
 */
export async function offerLivestock(_prev: FormState, formData: FormData): Promise<FormState> {
  const at = Date.now();
  if (isBot(formData)) return { status: "success", at };

  const locale = formLocale(formData);
  const values = submittedValues(formData, FIELDS);
  const parsed = schema().safeParse({ ...values, privacy: formData.get("privacy") ?? undefined });
  const fieldErrors = parsed.success ? {} : zodFieldErrors(parsed.error);
  const weight = weightError(values.category, values.avgWeight);
  if (weight && !fieldErrors.avgWeight) fieldErrors.avgWeight = weight;
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { status: "invalid", fieldErrors, values: submittedValues(formData, ECHO), at };
  }

  const v = parsed.data;
  const status = await insertSubmission("livestock_offers", locale, {
    category_id: v.category,
    head_count: v.headCount,
    avg_weight_kg: v.avgWeight,
    breed: v.breed || null,
    department: v.department,
    available_from: v.availableFrom,
    name: v.name,
    phone: v.phone,
    email: v.email || null,
    notes: v.notes || null,
    privacy_accepted: true,
  });
  return status === "success" ? { status, at } : { status, values: submittedValues(formData, ECHO), at };
}
