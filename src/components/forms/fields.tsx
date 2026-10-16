"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { IconAlert, IconCheck } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import type { Locale } from "@/i18n/routing";
import { formatFigure } from "@/lib/format";
import { HONEYPOT_FIELD, type FieldError } from "@/lib/forms/types";

/**
 * Campos de formulario reutilizables: label visible, ayuda y error asociados con
 * aria-describedby, aria-invalid y mensajes traducidos desde códigos (Forms.errors).
 */

const control =
  "block w-full rounded-md bg-surface px-3.5 py-2.5 text-base text-ink ring-1 ring-earth-300 ring-inset placeholder:text-ink-subtle " +
  "focus:ring-2 focus:ring-brand-700 focus:outline-none aria-invalid:ring-2 aria-invalid:ring-down disabled:bg-surface-muted";

/** Texto traducido de un error (los números con separador de miles; las fechas largas). */
export function useErrorText() {
  const t = useTranslations("Forms.errors");
  const locale = useLocale() as Locale;
  return (error: FieldError) => {
    const values = Object.fromEntries(
      Object.entries(error.values ?? {}).map(([k, v]) => [
        k,
        typeof v === "number"
          ? formatFigure(v, locale)
          : /^\d{4}-\d{2}-\d{2}$/.test(v)
            ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${v}T00:00:00Z`))
            : v,
      ]),
    );
    return t(error.code, values);
  };
}

type FieldProps = {
  name: string;
  label: string;
  error?: FieldError;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
};

function FieldShell({ name, label, error, hint, optional, className, children }: FieldProps & { children: ReactNode }) {
  const t = useTranslations("Forms");
  const errorText = useErrorText();
  return (
    <div className={className} data-field={name}>
      <label htmlFor={`f-${name}`} className="block font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-ink-muted">({t("optional")})</span>}
      </label>
      {hint && (
        <p id={`f-${name}-hint`} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`f-${name}-error`} data-error={error.code} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-down">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
          {errorText(error)}
        </p>
      )}
    </div>
  );
}

const describedBy = (name: string, error?: FieldError, hint?: ReactNode) =>
  [hint ? `f-${name}-hint` : null, error ? `f-${name}-error` : null].filter(Boolean).join(" ") || undefined;

export function TextField({
  name,
  label,
  error,
  hint,
  optional,
  className,
  suffix,
  ...props
}: FieldProps & Omit<ComponentProps<"input">, "name"> & { suffix?: string }) {
  return (
    <FieldShell name={name} label={label} error={error} hint={hint} optional={optional} className={className}>
      <div className="relative">
        <input
          id={`f-${name}`}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, error, hint)}
          required={!optional}
          className={cn(control, suffix && "pr-16")}
          {...props}
        />
        {suffix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  optional,
  className,
  children,
  ...props
}: FieldProps & Omit<ComponentProps<"select">, "name">) {
  return (
    <FieldShell name={name} label={label} error={error} hint={hint} optional={optional} className={className}>
      <select
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        required={!optional}
        className={cn(control, "appearance-auto pr-8")}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextAreaField({ name, label, error, hint, optional, className, ...props }: FieldProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <FieldShell name={name} label={label} error={error} hint={hint} optional={optional} className={className}>
      <textarea
        id={`f-${name}`}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        required={!optional}
        className={control}
        {...props}
      />
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  error,
  className,
  ...props
}: { name: string; label: ReactNode; error?: FieldError; className?: string } & Omit<ComponentProps<"input">, "name" | "type">) {
  const errorText = useErrorText();
  return (
    <div className={className} data-field={name}>
      <div className="flex items-start gap-3">
        <input
          id={`f-${name}`}
          name={name}
          type="checkbox"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `f-${name}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-brand-700"
          {...props}
        />
        <label htmlFor={`f-${name}`} className="text-ink">
          {label}
        </label>
      </div>
      {error && (
        <p id={`f-${name}-error`} data-error={error.code} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-down">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
          {errorText(error)}
        </p>
      )}
    </div>
  );
}

/** Campo trampa: fuera de la vista y del orden de tabulación; los lectores de pantalla lo ignoran. */
export function Honeypot() {
  const t = useTranslations("Forms");
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={`f-${HONEYPOT_FIELD}`}>{t("honeypot")}</label>
      <input id={`f-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

/** Botón de envío con estado "enviando" (useFormStatus). */
export function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonClasses({ size: "lg" }, "disabled:opacity-70")}>
      {pending ? (
        <>
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Aviso del resultado del envío (error general o límite alcanzado). */
export function FormAlert({ tone, title, children }: { tone: "error" | "success"; title: string; children?: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      data-form-alert={tone}
      className={cn(
        "flex gap-3 rounded-md p-4 ring-1 ring-inset",
        tone === "error" ? "bg-brand-50 text-brand-900 ring-brand-200" : "bg-earth-50 text-ink ring-earth-300",
      )}
    >
      {tone === "error" ? <IconAlert className="mt-0.5 shrink-0" /> : <IconCheck className="mt-0.5 shrink-0 text-up" />}
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm">{children}</div>}
      </div>
    </div>
  );
}
