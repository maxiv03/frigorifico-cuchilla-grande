// Aplica las migraciones pendientes a la base remota usando SUPABASE_DB_URL de .env.local.
// Se invoca la CLI con node directamente (sin shell) para que la URL no pase por cmd.exe,
// y la salida se filtra para que la contraseña nunca aparezca en consola.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Falta SUPABASE_DB_URL en .env.local");
  process.exit(1);
}
const { password } = new URL(url);
const secrets = [url, password, encodeURIComponent(password), decodeURIComponent(password)].filter(Boolean);
const redact = (text) => secrets.reduce((t, s) => t.split(s).join("•••"), text);

const cli = createRequire(import.meta.url).resolve("supabase/dist/supabase.js");
const child = spawn(process.execPath, [cli, "db", "push", "--db-url", url, "--yes", ...process.argv.slice(2)], {
  stdio: ["inherit", "pipe", "pipe"],
});
child.stdout.on("data", (d) => process.stdout.write(redact(d.toString())));
child.stderr.on("data", (d) => process.stderr.write(redact(d.toString())));
child.on("close", (code) => process.exit(code ?? 1));
