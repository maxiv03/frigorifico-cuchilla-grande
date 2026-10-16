"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { offerLivestock } from "@/app/[locale]/producers/actions";
import {
  CheckboxField,
  FormAlert,
  Honeypot,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms/fields";
import { Link } from "@/i18n/navigation";
import { initialFormState } from "@/lib/forms/types";
import { addDays, AVAILABLE_WITHIN_DAYS, DEPARTMENTS, todayUy } from "@/lib/producers/livestock";
import { useOffer } from "./offer-context";

const noop = () => () => {};

type Props = {
  categories: { id: string; name: string; species: "beef" | "lamb" }[];
};

/** Formulario "Ofrecer ganado": se vuelve a montar (key) cuando la calculadora lo precarga. */
export function OfferForm(props: Props) {
  const { prefill, version } = useOffer();
  return <OfferFormInner key={version} {...props} prefill={prefill} />;
}

function OfferFormInner({ categories, prefill }: Props & { prefill: ReturnType<typeof useOffer>["prefill"] }) {
  const t = useTranslations("Producers.form");
  const tc = useTranslations("Producers");
  const locale = useLocale();
  const [state, action] = useActionState(offerLivestock, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  // Fecha de hoy solo en el cliente (en el prerender sería la del build).
  const today = useSyncExternalStore(noop, todayUy, () => null);

  // Después de cada respuesta: foco en el primer campo con error, en el aviso o en el éxito.
  useEffect(() => {
    if (!state.at) return;
    if (state.status === "invalid") {
      const first = Object.keys(state.fieldErrors ?? {})[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else if (state.status === "success") {
      successRef.current?.focus();
    } else {
      alertRef.current?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} data-form-success className="rounded-lg bg-surface p-8 shadow-card ring-1 ring-line outline-none">
        <FormAlert tone="success" title={t("success.title")}>
          {t("success.text")}
        </FormAlert>
        <p className="mt-5 text-sm text-ink-muted">{t("success.demo")}</p>
      </div>
    );
  }

  const v = (name: string, fallback = "") => state.values?.[name] ?? fallback;
  const e = (name: string) => state.fieldErrors?.[name];
  const bySpecies = (["beef", "lamb"] as const).map((s) => ({ species: s, items: categories.filter((c) => c.species === s) }));

  return (
    <form ref={formRef} action={action} noValidate data-offer-form className="relative rounded-lg bg-surface p-6 shadow-card ring-1 ring-line sm:p-8">
      <input type="hidden" name="locale" value={locale} />
      <Honeypot />

      <div ref={alertRef} tabIndex={-1} className="outline-none">
        {state.status === "invalid" && (
          <FormAlert tone="error" title={t("invalid.title")}>
            {t("invalid.text", { count: Object.keys(state.fieldErrors ?? {}).length })}
          </FormAlert>
        )}
        {state.status === "rate_limited" && (
          <FormAlert tone="error" title={t("rateLimited.title")}>
            {t("rateLimited.text")}
          </FormAlert>
        )}
        {state.status === "error" && (
          <FormAlert tone="error" title={t("error.title")}>
            {t("error.text")}
          </FormAlert>
        )}
      </div>

      <fieldset className="mt-2 grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl font-semibold text-ink">{t("lot")}</legend>
        <SelectField name="category" label={t("category")} error={e("category")} defaultValue={v("category", prefill?.category ?? "")}>
          <option value="" disabled>
            {t("choose")}
          </option>
          {bySpecies.map(({ species, items }) => (
            <optgroup key={species} label={tc(`species.${species}`)}>
              {items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <TextField
          name="headCount"
          label={t("headCount")}
          error={e("headCount")}
          inputMode="numeric"
          defaultValue={v("headCount", prefill?.headCount ?? "")}
          suffix={t("headsUnit")}
        />
        <TextField
          name="avgWeight"
          label={t("avgWeight")}
          hint={t("avgWeightHint")}
          error={e("avgWeight")}
          inputMode="numeric"
          defaultValue={v("avgWeight", prefill?.avgWeight ?? "")}
          suffix="kg"
        />
        <TextField name="breed" label={t("breed")} hint={t("breedHint")} optional error={e("breed")} defaultValue={v("breed")} list="breeds" autoComplete="off" />
        <datalist id="breeds">
          {["Hereford", "Aberdeen Angus", "Braford", "Holando", "Corriedale", "Merino", "Texel", "Dohne Merino"].map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <SelectField name="department" label={t("department")} error={e("department")} defaultValue={v("department")}>
          <option value="" disabled>
            {t("choose")}
          </option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectField>
        <TextField
          name="availableFrom"
          type="date"
          label={t("availableFrom")}
          error={e("availableFrom")}
          min={today ?? undefined}
          max={today ? addDays(today, AVAILABLE_WITHIN_DAYS) : undefined}
          defaultValue={v("availableFrom")}
        />
      </fieldset>

      <fieldset className="mt-8 grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl font-semibold text-ink">{t("contact")}</legend>
        <TextField name="name" label={t("name")} error={e("name")} autoComplete="name" defaultValue={v("name")} />
        <TextField name="phone" type="tel" label={t("phone")} hint={t("phoneHint")} error={e("phone")} autoComplete="tel" defaultValue={v("phone")} />
        <TextField name="email" type="email" label={t("email")} optional error={e("email")} autoComplete="email" defaultValue={v("email")} />
        <TextAreaField name="notes" label={t("notes")} hint={t("notesHint")} optional error={e("notes")} defaultValue={v("notes")} className="sm:col-span-2" />
      </fieldset>

      <CheckboxField
        name="privacy"
        className="mt-8"
        error={e("privacy")}
        defaultChecked={v("privacy") === "on"}
        label={t.rich("privacy", {
          link: (chunks) => (
            <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-2">
              {chunks}
            </Link>
          ),
        })}
      />

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel={t("sending")}>{t("submit")}</SubmitButton>
        <p className="text-sm text-ink-muted">{t("demoNote")}</p>
      </div>
    </form>
  );
}
