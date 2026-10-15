import "server-only";
import { z } from "zod";

/** Variables de servidor. Se validan al primer uso para que el build no dependa de ellas. */
const serverSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
  CONTACT_EMAIL: z.email(),
  WHATSAPP_NUMBER: z.string().regex(/^\d{8,15}$/),
  IP_HASH_SALT: z.string().min(32),
});

let cached: z.infer<typeof serverSchema> | undefined;

export function serverEnv() {
  cached ??= serverSchema.parse(process.env);
  return cached;
}

/** Entorno de ejecución para la columna `env` de los formularios. */
export function runtimeEnv(): "development" | "preview" | "production" {
  const v = process.env.VERCEL_ENV;
  return v === "production" || v === "preview" ? v : "development";
}
