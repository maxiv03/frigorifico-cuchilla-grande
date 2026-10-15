/**
 * Verifica traducciones de interfaz Y de contenido.
 *   npm run i18n:check
 * 1. Mensajes next-intl: mismas claves en todos los idiomas, sin vacíos, sin valores
 *    iguales al idioma por defecto (salvo allowlist), mismos placeholders ICU.
 * 2. Contenido (supabase/seed/* y src/data/company.ts): todo objeto con claves de idioma
 *    debe tener todos los idiomas, sin vacíos ni copias del idioma por defecto.
 * 3. Los locales del seed coinciden con routing.locales.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { company } from "@/data/company";
import { routing } from "@/i18n/routing";
import * as seed from "../supabase/seed";
import { allowedMessageKeys, allowedValues } from "./i18n-allowlist";

const locales = routing.locales as readonly string[];
const defaultLocale = routing.defaultLocale;
const errors: string[] = [];

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix = "", out: Record<string, string> = {}) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = String(obj);
  }
  return out;
}

// Solo nombres de argumento ICU ("{count, plural, …}" o "{cut}"), no el texto de las ramas.
const placeholders = (s: string) => [...new Set([...s.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((m) => m[1]))].sort().join(",");

// ─── 1. Mensajes ────────────────────────────────────────────────────────────
const messages = Object.fromEntries(
  locales.map((l) => [
    l,
    flatten(JSON.parse(readFileSync(join(process.cwd(), "src/messages", `${l}.json`), "utf8"))),
  ]),
) as Record<string, Record<string, string>>;

const reference = messages[defaultLocale];
for (const locale of locales) {
  const current = messages[locale];
  for (const key of Object.keys(reference)) {
    const value = current[key];
    if (value === undefined) {
      errors.push(`[mensajes:${locale}] falta la clave ${key}`);
      continue;
    }
    if (value.trim() === "") errors.push(`[mensajes:${locale}] ${key} está vacío`);
    if (locale !== defaultLocale && value === reference[key] && !allowedMessageKeys.includes(key)) {
      errors.push(`[mensajes:${locale}] ${key} es igual al ${defaultLocale}: "${value}"`);
    }
    if (placeholders(value) !== placeholders(reference[key])) {
      errors.push(`[mensajes:${locale}] ${key} tiene placeholders distintos`);
    }
  }
  for (const key of Object.keys(current)) {
    if (!(key in reference)) errors.push(`[mensajes:${locale}] clave sobrante ${key}`);
  }
}

// ─── 2. Contenido ───────────────────────────────────────────────────────────
let localizedFields = 0;

function isLocalized(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && locales.some((l) => l in v);
}

/** Campos traducibles opcionales por idioma (pueden faltar; si están, no vacíos ni copiados). */
const OPTIONAL_PER_LOCALE = new Set(["alias"]);

function walk(value: unknown, path: string) {
  if (isLocalized(value)) {
    localizedFields++;
    const optional = OPTIONAL_PER_LOCALE.has(path.split(".").pop() ?? "");
    const ref = value[defaultLocale];
    for (const l of locales) {
      const v = value[l];
      if (optional && v === undefined) continue;
      if (typeof v !== "string" || v.trim() === "") {
        errors.push(`[contenido] ${path}.${l} vacío o faltante`);
      } else if (l !== defaultLocale && v === ref && !allowedValues.includes(v)) {
        errors.push(`[contenido] ${path}.${l} es igual al ${defaultLocale}: "${v}"`);
      }
    }
    for (const k of Object.keys(value)) {
      if (!locales.includes(k)) errors.push(`[contenido] ${path} tiene un idioma desconocido: ${k}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => {
      const id = v && typeof v === "object" && "id" in v ? String((v as { id: unknown }).id) : String(i);
      walk(v, `${path}[${id}]`);
    });
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
  }
}

walk(company, "company");
for (const [name, value] of Object.entries(seed)) walk(value, `seed.${name}`);

// ─── 3. Locales del seed ────────────────────────────────────────────────────
const seedLocales = seed.locales.map((l) => l.code).sort().join(",");
if (seedLocales !== [...locales].sort().join(",")) {
  errors.push(`[locales] seed (${seedLocales}) ≠ routing (${[...locales].sort().join(",")})`);
}

// ─── Resultado ──────────────────────────────────────────────────────────────
console.log(
  `i18n:check — ${locales.length} idiomas, ${Object.keys(reference).length} mensajes, ${localizedFields} campos de contenido`,
);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\n${errors.length} problemas de traducción.`);
  process.exit(1);
}
console.log("  ✓ Sin problemas.");
