import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la clave SECRETA (service_role, ignora RLS).
 * Permitido SOLO en src/app/api/cron/daily/route.ts. Los scripts usan scripts/lib/db.ts.
 */
export function adminDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
