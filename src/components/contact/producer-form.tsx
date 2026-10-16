"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { contactProducer } from "@/app/[locale]/contact/actions";
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
import { PRODUCER_REASONS } from "@/lib/forms/contact-rules";
import { initialFormState } from "@/lib/forms/types";
import { DEPARTMENTS } from "@/lib/producers/livestock";

/** Consulta de productores → producer_contacts. Para ofrecer un lote, el formulario del portal. */
export function ProducerForm() {
  const t = useTranslations("Contact.producer");
  const tf = useTranslations("Contact.form");
  const locale = useLocale();
  const [state, action] = useActionState(contactProducer, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  useResponseFocus(state, { form: formRef, alert: alertRef, success: successRef });

  if (state.status === "success") {
    return <FormSuccess successRef={successRef} title={t("success.title")} text={t("success.text")} demo={tf("successDemo")} />;
  }

  const v = (name: string, fallback = "") => state.values?.[name] ?? fallback;
  const e = (name: string) => state.fieldErrors?.[name];

  return (
    <form ref={formRef} action={action} noValidate data-contact-form="producer" className="relative rounded-lg bg-surface p-6 shadow-card ring-1 ring-line sm:p-8">
      <input type="hidden" name="locale" value={locale} />
      <Honeypot />
      <FormStatusAlerts state={state} alertRef={alertRef} />

      <fieldset className="mt-2 grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-xl font-semibold text-ink">{t("legend")}</legend>
        <TextField name="name" label={t("name")} error={e("name")} autoComplete="name" defaultValue={v("name")} />
        <TextField name="phone" type="tel" label={t("phone")} hint={t("phoneHint")} error={e("phone")} autoComplete="tel" defaultValue={v("phone")} />
        <SelectField name="department" label={t("department")} error={e("department")} defaultValue={v("department")}>
          <option value="" disabled>
            {tf("choose")}
          </option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectField>
        <SelectField name="reason" label={t("reason")} error={e("reason")} defaultValue={v("reason")}>
          <option value="" disabled>
            {tf("choose")}
          </option>
          {PRODUCER_REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`reasons.${r}`)}
            </option>
          ))}
        </SelectField>
        <TextAreaField name="message" label={t("message")} hint={t("messageHint")} error={e("message")} defaultValue={v("message")} className="sm:col-span-2" />
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
