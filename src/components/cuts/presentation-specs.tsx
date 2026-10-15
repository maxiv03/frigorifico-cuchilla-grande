import { useLocale, useTranslations } from "next-intl";
import { presentationSpecs } from "@/data/presentations";
import { formatFigure } from "@/lib/format";
import { PRESENTATIONS } from "@/lib/catalog/types";
import { cn } from "@/components/ui/cn";

/** Datos generales por presentación (temperatura, vida útil, caja). Iguales para todos los cortes. */
export function PresentationSpecs({ className, only }: { className?: string; only?: readonly string[] }) {
  const t = useTranslations("Products");
  const locale = useLocale();
  const n = (v: number) => formatFigure(v, locale);
  const list = PRESENTATIONS.filter((p) => !only || only.includes(p));

  return (
    <div className={cn("rounded-lg bg-earth-50 p-5 ring-1 ring-earth-200", className)}>
      <h3 className="font-semibold text-ink">{t("specs.title")}</h3>
      <dl className="mt-3 space-y-3 text-sm leading-relaxed">
        {list.map((p) => {
          const s = presentationSpecs[p];
          return (
            <div key={p}>
              <dt className="font-semibold text-earth-800">{t(`presentation.${p}`)}</dt>
              <dd className="text-ink-muted">
                {p === "chilled"
                  ? t("specs.chilled", {
                      min: n(s.tempMin),
                      max: n(s.tempMax ?? 0),
                      beef: n(s.shelfLife.value.beef),
                      lamb: n(s.shelfLife.value.lamb),
                      boxMin: n(s.boxKg[0]),
                      boxMax: n(s.boxKg[1]),
                    })
                  : t("specs.frozen", {
                      min: n(s.tempMin),
                      months: n(s.shelfLife.value.beef),
                      boxMin: n(s.boxKg[0]),
                      boxMax: n(s.boxKg[1]),
                    })}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs text-ink-subtle">{t("specs.note")}</p>
    </div>
  );
}
