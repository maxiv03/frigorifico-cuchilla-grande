/**
 * Verifica RLS + grants con la clave PUBLICABLE (rol anon), la misma que usa el sitio.
 *   npm run db:test-permissions
 * Espera: contenido legible; formularios solo insertables (sin leer/editar/borrar);
 * columnas protegidas no escribibles; límite de envíos activo; contenido no escribible.
 */
import { createHash, randomBytes } from "node:crypto";
import { adminClient, anonClient } from "./lib/db";

const anon = anonClient();
const admin = adminClient();

const CONTENT_TABLES = [
  "locales", "certifications", "certification_translations",
  "markets", "market_translations", "market_certifications",
  "cut_zones", "cut_zone_translations", "cuts", "cut_translations", "cut_markets",
  "news_posts", "news_translations",
  "sustainability_goals", "sustainability_goal_translations",
  "price_categories", "price_category_translations", "price_quotes", "price_board",
];

// Hash único por corrida: así las filas de prueba se borran sin tocar otras.
const testIp = createHash("sha256").update(randomBytes(16)).digest("hex");
const base = { env: "development", locale: "es", ip_hash: testIp, privacy_accepted: true };

const FORMS: Record<string, Record<string, unknown>> = {
  quote_requests: {
    ...base,
    company: "Prueba permisos",
    contact_name: "Test",
    email: "test@example.com",
    country: "Uruguay",
    cuts_of_interest: "test",
    volume: "1 contenedor",
    presentation: "frozen",
  },
  producer_contacts: { ...base, name: "Test", phone: "099000000", department: "Durazno", message: "test" },
  livestock_offers: {
    ...base,
    category_id: "steer",
    head_count: 10,
    avg_weight_kg: 480,
    department: "Durazno",
    available_from: "2030-01-01",
    name: "Test",
    phone: "099000000",
    breed: "Hereford",
  },
};

let failures = 0;
/** 42501 = permission denied (falta de grant), que es lo que queremos ver. */
const denied = (e: { code?: string } | null) => e?.code === "42501";
function check(ok: boolean, label: string, detail = "") {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}${!ok && detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  console.log("Contenido (anon puede leer, no escribir):");
  for (const t of CONTENT_TABLES) {
    const { error } = await anon.from(t).select("*").limit(1);
    check(!error, `SELECT ${t}`, error?.message);
  }
  const writeTargets: { t: string; key: string; row: Record<string, unknown>; patch: Record<string, unknown> }[] = [
    { t: "locales", key: "code", row: { code: "xx", name: "Test" }, patch: { sort: 1 } },
    { t: "price_quotes", key: "category_id", row: { category_id: "steer", week_start: "2030-01-07", price_usd_kg: 1 },
      patch: { price_usd_kg: 1 },
    },
    { t: "cuts", key: "id", row: { id: "x", species: "beef", zone_id: "x", bone: "boneless", presentations: ["frozen"] },
      patch: { sort: 1 },
    },
  ];
  for (const { t, key, row, patch } of writeTargets) {
    const ins = await anon.from(t).insert(row);
    check(denied(ins.error), `INSERT ${t} rechazado`, ins.error?.message ?? "se permitió escribir");
    const upd = await anon.from(t).update(patch).neq(key, "__none__");
    check(denied(upd.error), `UPDATE ${t} rechazado`, upd.error?.message ?? "se permitió actualizar");
    const del = await anon.from(t).delete().neq(key, "__none__");
    check(denied(del.error), `DELETE ${t} rechazado`, del.error?.message ?? "se permitió borrar");
  }

  console.log("Formularios (anon solo inserta):");
  for (const [t, row] of Object.entries(FORMS)) {
    const ins = await anon.from(t).insert(row);
    check(!ins.error, `INSERT ${t}`, ins.error?.message);

    const sel = await anon.from(t).select("*").limit(1);
    check(denied(sel.error), `SELECT ${t} rechazado`, sel.error?.message ?? `devolvió ${sel.data?.length} filas`);

    const insRet = await anon.from(t).insert(row).select();
    check(denied(insRet.error), `INSERT … RETURNING ${t} rechazado`, insRet.error?.message ?? "devolvió la fila");

    const upd = await anon.from(t).update({ env: "production" }).eq("ip_hash", testIp).select();
    check(denied(upd.error), `UPDATE ${t} rechazado`, upd.error?.message ?? "se permitió actualizar");

    const del = await anon.from(t).delete().eq("ip_hash", testIp).select();
    check(denied(del.error), `DELETE ${t} rechazado`, del.error?.message ?? "se permitió borrar");

    const forged = await anon.from(t).insert({ ...row, created_at: "2000-01-01T00:00:00Z" });
    check(denied(forged.error), `INSERT ${t} con created_at forjado rechazado`, forged.error?.message ?? "se aceptó");
  }

  console.log("Aceptación de privacidad obligatoria:");
  for (const [t, row] of Object.entries(FORMS)) {
    const noConsent = await anon.from(t).insert({ ...row, privacy_accepted: false });
    check(noConsent.error?.code === "23514", `INSERT ${t} sin aceptar privacidad rechazado`, noConsent.error?.message ?? "se aceptó");
  }

  console.log("Límite de envíos (5 por IP cada 10 min):");
  const rlIp = createHash("sha256").update(randomBytes(16)).digest("hex");
  let blockedAt = 0;
  for (let i = 1; i <= 6; i++) {
    const { error } = await anon.from("producer_contacts").insert({ ...FORMS.producer_contacts, ip_hash: rlIp });
    if (error) {
      blockedAt = i;
      check(error.message.includes("rate_limited"), "error esperado rate_limited", error.message);
      break;
    }
  }
  check(blockedAt === 6, "el 6.º envío se bloquea", `bloqueó en ${blockedAt || "ninguno"}`);

  console.log("Funciones internas:");
  const rpc = await anon.rpc("enforce_form_rate_limit" as never);
  check(!!rpc.error, "RPC enforce_form_rate_limit rechazado", "se pudo ejecutar");

  // Limpieza con la clave secreta.
  for (const t of Object.keys(FORMS)) {
    await admin.from(t).delete().in("ip_hash", [testIp, rlIp]);
  }

  console.log(failures === 0 ? "\nPermisos OK." : `\n${failures} verificaciones fallaron.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
