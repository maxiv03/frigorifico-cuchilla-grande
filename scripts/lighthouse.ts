/**
 * Lighthouse móvil (simulación por defecto: Moto G Power, 4G lenta, CPU ×4) sobre las páginas
 * clave en ES y EN.
 *   npm run lighthouse -- <url-base> [--label <nombre>]
 * Usa el Chromium de Playwright. Informes JSON y HTML en screenshots/lighthouse/<label>/ y un
 * resumen en summary.json (puntajes, LCP, CLS, TBT, JS transferido).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const base = (args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--label") ?? "http://localhost:3000").replace(/\/$/, "");
const label = args[args.indexOf("--label") + 1] && args.includes("--label") ? args[args.indexOf("--label") + 1] : "produccion";
const out = join(process.cwd(), "screenshots", "lighthouse", label);
mkdirSync(out, { recursive: true });

const PAGES: [name: string, es: string, en: string][] = [
  ["home", "/es", "/en"],
  ["catalogo", "/es/productos", "/en/products"],
  ["corte", "/es/productos/vacuno/lomo", "/en/products/beef/tenderloin"],
  ["mercados", "/es/mercados", "/en/markets"],
  ["productores", "/es/productores", "/en/producers"],
  ["contacto", "/es/contacto", "/en/contact"],
];

type Row = { page: string; locale: string; path: string; performance: number; accessibility: number; bestPractices: number; seo: number; lcp: string; cls: string; tbt: string; fcp: string; jsKB: number; failing: string[] };
const rows: Row[] = [];
const chrome = chromium.executablePath();
const cli = join(process.cwd(), "node_modules", "lighthouse", "cli", "index.js");

for (const [name, es, en] of PAGES) {
  for (const [locale, path] of [["es", es], ["en", en]] as const) {
    const file = join(out, `${locale}_${name}`);
    execFileSync(
      process.execPath,
      [cli, `${base}${path}`, "--quiet", "--chrome-flags=--headless=new", "--output=json", "--output=html", `--output-path=${file}`, "--only-categories=performance,accessibility,best-practices,seo"],
      { env: { ...process.env, CHROME_PATH: chrome }, stdio: "inherit" },
    );
    const r = JSON.parse(readFileSync(`${file}.report.json`, "utf8"));
    const score = (k: string) => Math.round(r.categories[k].score * 100);
    const js = (r.audits["network-requests"].details.items as { resourceType: string; transferSize: number }[])
      .filter((i) => i.resourceType === "Script")
      .reduce((n, i) => n + i.transferSize, 0);
    const failing: string[] = [];
    for (const cat of ["accessibility", "best-practices", "seo"]) {
      for (const ref of r.categories[cat].auditRefs) {
        const a = r.audits[ref.id];
        if (ref.weight > 0 && a.score !== null && a.score < 1) failing.push(`${cat}: ${a.id}`);
      }
    }
    rows.push({
      page: name,
      locale,
      path,
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
      lcp: r.audits["largest-contentful-paint"].displayValue,
      cls: r.audits["cumulative-layout-shift"].displayValue,
      tbt: r.audits["total-blocking-time"].displayValue,
      fcp: r.audits["first-contentful-paint"].displayValue,
      jsKB: Math.round(js / 1024),
      failing,
    });
    const row = rows.at(-1)!;
    console.log(`${locale} ${name}: P ${row.performance} · A ${row.accessibility} · BP ${row.bestPractices} · SEO ${row.seo} · LCP ${row.lcp} · CLS ${row.cls} · TBT ${row.tbt} · JS ${row.jsKB} KB${failing.length ? ` · ${failing.join(", ")}` : ""}`);
  }
}
writeFileSync(join(out, "summary.json"), `${JSON.stringify({ base, at: new Date().toISOString(), rows }, null, 2)}\n`);
