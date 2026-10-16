import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/**
 * Cliente con la clave PUBLICABLE (rol anon). Úsese para TODA lectura de contenido
 * y todos los inserts de formularios, así RLS y grants se aplican de verdad.
 */
export function publicDb() {
  const env = serverEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
