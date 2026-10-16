"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { requestQuote } from "@/app/[locale]/contact/actions";
import {
  CheckboxField,
  FormStatusAlerts,
  FormSuccess,
  Honeypot,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
  useResponseFocus,
} from "@/components/forms/fields";
import { Link } from "@/i18n/navigation";
import { INCOTERMS, PRESENTATIONS, VOLUME_LIMITS, VOLUME_UNITS } from "@/lib/forms/contact-rules";
import { initialFormState } from "@/lib/forms/types";
import { formatFigure } from "@/lib/format";
import type { Locale } from "@/i18n/routing";
import { CutPicker, type CutOption } from "./cut-picker";

/** Pedido de cotización → quote_requests. `initialCuts` llega de ?cut=<id> (precarga desde el catálogo). */
export function QuoteForm({ cuts, initialCuts, speciesLabels }: { cuts: CutOption[]; initialCuts: string[]; speciesLabels: Record<"beef" | "lamb", string> }) {
  const t = useTranslations("Contact.quote");
  const tf = useTranslations("Contact.form");
  const locale = useLocale() as Locale;
  const [state, action] = useActionState(requestQuote, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  useResponseFocus(state, { form: formRef, alert: alertRef, success: successRef });

  if (state.status === "success") {
    return <FormSuccess successRef={successRef} title={t("success.title")} text={t("success.text")} demo={tf("successDemo")} />;
  }

  const v = (name: string, fallback = "") => state.values?.[name] ?? fallback;
  const e = (name: string) => state.fieldErrors?.[name];
  const selected = state.values?.cuts !== undefined ? state.values.cuts.split(",").filter(Boolean) : initialCuts;
  const range = (unit: keyof typeof VOLUME_LIMITS) =>
    t("volume.range", { min: formatFigure(VOLUME_LIMITS[unit].min, locale), max: formatFigure(VOLUME_LIMITS[unit].max, locale) });

  return (
    <form ref={formRef} action={action} noValidate data-contact-form="quote" className="relative rounded-lg bg-surface p-6 shadow-card ring-1 ring-line sm:p-8">
      <input type="hidden" name="locale" value={locale} />
      <Honeypot />
      <FormStatusAlerts state={state} alertRef={alertRef} />

      <fieldset className="mt-2 grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl font-semibold text-ink">{t("company.legend")}</legend>
        <TextField name="company" label={t("company.company")} error={e("company")} autoComplete="organization" defaultValue={v("company")} />
        <TextField name="country" label={t("company.country")} error={e("country")} autoComplete="country-name" defaultValue={v("country")} />
        <TextField name="contactName" label={t("company.contactName")} error={e("contactName")} autoComplete="name" defaultValue={v("contactName")} />
        <TextField name="email" type="email" label={t("company.email")} error={e("email")} autoComplete="email" defaultValue={v("email")} />
        <TextField
          name="phone"
          type="tel"
          label={t("company.phone")}
          hint={t("company.phoneHint")}
          optional
          error={e("phone")}
          autoComplete="tel"
          defaultValue={v("phone")}
        />
      </fieldset>

      <fieldset className="mt-8 grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl font-semibold text-ink">{t("order.legend")}</legend>
        <CutPicker options={cuts} defaultSelected={selected} error={e("cuts")} speciesLabels={speciesLabels} />
        <div className="grid gap-x-5 gap-y-2 sm:col-span-2 sm:grid-cols-2" data-volume>
          <TextField
            name="volumeAmount"
            label={t("volume.label")}
            error={e("volumeAmount")}
            inputMode="numeric"
            defaultValue={v("volumeAmount")}
            aria-describedby={["f-volume-hint", e("volumeAmount") ? "f-volumeAmount-error" : null].filter(Boolean).join(" ")}
          />
          <SelectField name="volumeUnit" label={t("volume.unit")} error={e("volumeUnit")} defaultValue={v("volumeUnit", "tonnes_month")} aria-describedby="f-volume-hint">
            {VOLUME_UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`volume.units.${u}`)}
              </option>
            ))}
          </SelectField>
          <p id="f-volume-hint" className="text-sm text-ink-muted sm:col-span-2">
            {t("volume.unitHint", { tonnes: range("tonnes_month"), containers: range("containers_month") })}
          </p>
        </div>
        <SelectField name="presentation" label={t("order.presentation")} hint={t("order.presentationHint")} error={e("presentation")} defaultValue={v("presentation")}>
          <option value="" disabled>
            {tf("choose")}
          </option>
          {PRESENTATIONS.map((p) => (
            <option key={p} value={p}>
              {t(`order.presentations.${p}`)}
            </option>
          ))}
        </SelectField>
        <SelectField name="incoterm" label={t("order.incoterm")} hint={t("order.incotermHint")} optional error={e("incoterm")} defaultValue={v("incoterm")}>
          <option value="">{t("order.incotermNone")}</option>
          {INCOTERMS.map((i) => (
            <option key={i} value={i}>
              {t(`order.incoterms.${i}`)}
            </option>
          ))}
        </SelectField>
        <TextField
          name="destinationPort"
          label={t("order.port")}
          hint={t("order.portHint")}
          optional
          error={e("destinationPort")}
          defaultValue={v("destinationPort")}
        />
        <TextAreaField name="message" label={t("order.message")} hint={t("order.messageHint")} optional error={e("message")} defaultValue={v("message")} className="sm:col-span-2" />
      </fieldset>

      <CheckboxField
        name="privacy"
        className="mt-8"
        error={e("privacy")}
        defaultChecked={v("privacy") === "on"}
        label={tf.rich("privacy", {
          link: (chunks) => (
            <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-2">
              {chunks}
            </Link>
          ),
        })}
      />

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel={tf("sending")}>{t("submit")}</SubmitButton>
        <p className="text-sm text-ink-muted">{tf("demoNote")}</p>
      </div>
    </form>
  );
}
