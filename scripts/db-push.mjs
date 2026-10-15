// Aplica las migraciones pendientes a la base remota usando SUPABASE_DB_URL de .env.local.
// Se invoca la CLI con node directamente (sin shell) para que la URL no pase por cmd.exe.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Falta SUPABASE_DB_URL en .env.local");
  process.exit(1);
}
const cli = createRequire(import.meta.url).resolve("supabase/dist/supabase.js");
const r = spawnSync(process.execPath, [cli, "db", "push", "--db-url", url, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(r.status ?? 1);
