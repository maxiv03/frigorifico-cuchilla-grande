"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { SelectField, TextField } from "@/components/forms/fields";
import { IconArrowRight } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { formatDecimal, formatFigure, formatPrice, formatUsd } from "@/lib/format";
import type { FieldError } from "@/lib/forms/types";
import { estimateLot, HEADS, LIMITS } from "@/lib/producers/livestock";
import { useOffer } from "./offer-context";

export type CalculatorCategory = { id: string; name: string; species: "beef" | "lamb"; price: number; yieldPct: number };

type Props = { categories: CalculatorCategory[]; weekStart: string };

/** "480" → 480; vacío o con otros caracteres → NaN. Acepta coma decimal en el rendimiento. */
const parse = (v: string, decimals = false) => {
  const s = v.trim().replace(",", ".");
  if (s === "") return NaN;
  return (decimals ? /^\d+(\.\d+)?$/ : /^\d+$/).test(s) ? Number(s) : NaN;
};

function validate(value: string, range: { min: number; max: number }, decimals = false): FieldError | undefined {
  if (value.trim() === "") return { code: "required" };
  const n = parse(value, decimals);
  if (Number.isNaN(n)) return { code: decimals ? "range" : "integer", values: range };
  if (n < range.min || n > range.max) return { code: "range", values: range };
  return undefined;
}

/**
 * Calculadora orientativa: kg carcasa = cabezas × peso vivo × rendimiento; monto bruto = kg ×
 * precio de la pizarra vigente. Rendimiento por defecto el de la categoría, editable en un rango.
 */
export function Calculator({ categories, weekStart }: Props) {
  const t = useTranslations("Producers.calculator");
  const tp = useTranslations("Producers");
  const locale = useLocale() as Locale;
  const { offerLot } = useOffer();
  const resultId = useId();

  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  const [heads, setHeads] = useState("40");
  const [weight, setWeight] = useState("480");
  const [yieldStr, setYieldStr] = useState(category ? formatDecimal(category.yieldPct, locale) : "");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  if (!category) return null;
  const limits = LIMITS[category.species];
  const errors = {
    heads: validate(heads, HEADS),
    weight: validate(weight, limits.weight),
    yield: validate(yieldStr, limits.yield, true),
  };
  const valid = !errors.heads && !errors.weight && !errors.yield;
  const result = valid
    ? estimateLot({ heads: parse(heads), weight: parse(weight), yieldPct: parse(yieldStr, true), price: category.price })
    : null;
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : undefined);

  const changeCategory = (id: string) => {
    const next = categories.find((c) => c.id === id);
    if (!next) return;
    setCategoryId(id);
    // Rendimiento por defecto de la nueva categoría; peso típico si el actual queda fuera de rango.
    setYieldStr(formatDecimal(next.yieldPct, locale));
    if (next.species !== category.species) setWeight(next.species === "beef" ? "480" : "42");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10" data-calculator>
      <form
        noValidate
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-5 rounded-lg bg-surface p-6 shadow-card ring-1 ring-line sm:grid-cols-2 sm:p-8 lg:col-span-7"
      >
        <SelectField name="calc-category" label={t("category")} value={categoryId} onChange={(e) => changeCategory(e.target.value)} className="sm:col-span-2">
          {(["beef", "lamb"] as const).map((s) => (
            <optgroup key={s} label={tp(`species.${s}`)}>
              {categories
                .filter((c) => c.species === s)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </SelectField>
        <TextField
          name="calc-heads"
          label={t("heads")}
          inputMode="numeric"
          value={heads}
          onChange={(e) => setHeads(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, heads: true }))}
          error={show("heads")}
          hint={t("range", { min: formatFigure(HEADS.min, locale), max: formatFigure(HEADS.max, locale) })}
          suffix={t("headsUnit")}
        />
        <TextField
          name="calc-weight"
          label={t("weight")}
          inputMode="numeric"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, weight: true }))}
          error={show("weight")}
          hint={t("range", { min: formatFigure(limits.weight.min, locale), max: formatFigure(limits.weight.max, locale) })}
          suffix="kg"
        />
        <TextField
          name="calc-yield"
          label={t("yield")}
          inputMode="decimal"
          value={yieldStr}
          onChange={(e) => setYieldStr(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, yield: true }))}
          error={show("yield")}
          hint={t("yieldHint", {
            value: formatDecimal(category.yieldPct, locale),
            min: formatFigure(limits.yield.min, locale),
            max: formatFigure(limits.yield.max, locale),
          })}
          suffix="%"
        />
        <div data-field="calc-price">
          <p className="font-semibold text-ink" id="calc-price-label">
            {t("price")}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {t("priceHint", { date: new Date(`${weekStart}T12:00:00Z`) })}
          </p>
          <p className="mt-1.5 flex min-h-11 items-center rounded-md bg-surface-muted px-3.5 ring-1 ring-line ring-inset">
            <span className="font-semibold text-ink tabular-nums" data-price={category.price}>
              {t("priceValue", { price: formatPrice(category.price, locale) })}
            </span>
          </p>
        </div>
      </form>

      <div className="lg:col-span-5">
        <div
          id={resultId}
          role="status"
          aria-live="polite"
          data-result={result ? "ok" : "invalid"}
          className="rounded-lg bg-earth-700 p-6 text-white shadow-raised sm:p-8"
        >
          <h3 className="font-sans text-sm font-semibold tracking-[0.14em] text-earth-100 uppercase">{t("result")}</h3>
          {result ? (
            <dl className="mt-5 space-y-5">
              <div>
                <dt className="text-earth-100">{t("carcassKg")}</dt>
                <dd className="font-serif text-4xl font-semibold tabular-nums" data-carcass-kg={Math.round(result.carcassKg)}>
                  {t("kgValue", { kg: formatFigure(Math.round(result.carcassKg), locale) })}
                </dd>
              </div>
              <div>
                <dt className="text-earth-100">{t("gross")}</dt>
                <dd className="font-serif text-4xl font-semibold tabular-nums" data-gross-usd={Math.round(result.grossUsd)}>
                  {formatUsd(result.grossUsd, locale)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-5 text-earth-100">{t("fixErrors")}</p>
          )}
          <p className="mt-6 border-t border-white/20 pt-4 text-sm text-earth-100">{t("disclaimer")}</p>
        </div>
        <button
          type="button"
          disabled={!valid}
          onClick={() => offerLot({ category: category.id, headCount: String(parse(heads)), avgWeight: String(parse(weight)) })}
          className={buttonClasses({ variant: "primary", size: "lg" }, "mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60")}
        >
          {t("offer")}
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
