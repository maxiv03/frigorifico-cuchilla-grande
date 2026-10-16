"use client";

import { useLocale, useTranslations } from "next-intl";
import { createContext, useContext, useEffect, type ComponentProps, type ReactNode, type RefObject } from "react";
import { useFormStatus } from "react-dom";
import { IconAlert, IconCheck } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import type { Locale } from "@/i18n/routing";
import { formatDate, formatFigure } from "@/lib/format";
import { HONEYPOT_FIELD, type FieldError, type FormState } from "@/lib/forms/types";

/**
 * Campos de formulario reutilizables: label visible, ayuda y error asociados con
 * aria-describedby, aria-invalid y mensajes traducidos desde códigos (Forms.errors).
 */

/**
 * Prefijo de los ids de campo (`f-<name>` por defecto). Dos formularios en la misma página (las
 * pestañas de contacto) usan prefijos distintos para no repetir ids: `<FieldIdScope value="fp">`.
 */
const FieldIdPrefix = createContext("f");
export const FieldIdScope = FieldIdPrefix.Provider;
export const useFieldId = () => {
  const prefix = useContext(FieldIdPrefix);
  return (name: string, suffix?: string) => `${prefix}-${name}${suffix ? `-${suffix}` : ""}`;
};

export const control =
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
            ? formatDate(v, locale)
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
  const id = useFieldId();
  const t = useTranslations("Forms");
  const errorText = useErrorText();
  return (
    <div className={cn("scroll-below-header", className)} data-field={name}>
      <label htmlFor={id(name)} className="block font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-ink-muted">({t("optional")})</span>}
      </label>
      {hint && (
        <p id={id(name, "hint")} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={id(name, "error")} data-error={error.code} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-down">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
          {errorText(error)}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: ReturnType<typeof useFieldId>, name: string, error?: FieldError, hint?: ReactNode) =>
  [hint ? id(name, "hint") : null, error ? id(name, "error") : null].filter(Boolean).join(" ") || undefined;

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
  const id = useFieldId();
  return (
    <FieldShell name={name} label={label} error={error} hint={hint} optional={optional} className={className}>
      <div className="relative">
        <input
          id={id(name)}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, name, error, hint)}
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
  const id = useFieldId();
  return (
    <FieldShell name={name} label={label} error={error} hint={hint} optional={optional} className={className}>
      <select
        id={id(name)}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, name, error, hint)}
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
  const id = useFieldId();
  return (
    <FieldShell name={name} label={label} error={error} hint={hint} optional={optional} className={className}>
      <textarea
        id={id(name)}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, name, error, hint)}
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
  const id = useFieldId();
  const errorText = useErrorText();
  return (
    <div className={cn("scroll-below-header", className)} data-field={name}>
      <div className="flex items-start gap-3">
        <input
          id={id(name)}
          name={name}
          type="checkbox"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? id(name, "error") : undefined}
          className="mt-1 size-5 shrink-0 accent-brand-700"
          {...props}
        />
        <label htmlFor={id(name)} className="text-ink">
          {label}
        </label>
      </div>
      {error && (
        <p id={id(name, "error")} data-error={error.code} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-down">
          <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
          {errorText(error)}
        </p>
      )}
    </div>
  );
}

/**
 * Después de un envío con errores: lleva el aviso a la vista (debajo del header, por su
 * scroll-margin) y pone el foco en el primer campo con error sin volver a desplazar, así quedan
 * visibles los dos. Si el aviso y el campo no entran juntos, manda el campo.
 */
export function revealFirstError(form: HTMLFormElement | null, alert: HTMLElement | null, firstName?: string) {
  // Un grupo (lista de casillas) puede designar su control de foco con data-focus-for.
  const field = firstName
    ? (form?.querySelector<HTMLElement>(`[data-focus-for="${firstName}"]`) ?? form?.querySelector<HTMLElement>(`[name="${firstName}"]`))
    : null;
  const wrapper = field?.closest<HTMLElement>("[data-field]");
  const target = alert?.querySelector<HTMLElement>("[data-form-alert]") ?? alert;
  if (target && wrapper) {
    const span = wrapper.getBoundingClientRect().bottom - target.getBoundingClientRect().top;
    const header = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    (span + header <= window.innerHeight ? target : wrapper).scrollIntoView({ block: "start" });
  } else {
    (target ?? wrapper)?.scrollIntoView({ block: "start" });
  }
  (field ?? alert)?.focus({ preventScroll: true });
}

/** Campo trampa: fuera de la vista y del orden de tabulación; los lectores de pantalla lo ignoran. */
export function Honeypot() {
  const id = useFieldId();
  const t = useTranslations("Forms");
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
      <label htmlFor={id(HONEYPOT_FIELD)}>{t("honeypot")}</label>
      <input id={id(HONEYPOT_FIELD)} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
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
        "scroll-below-header flex gap-3 rounded-md p-4 ring-1 ring-inset",
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

/**
 * Después de cada respuesta de la acción: errores → aviso y primer campo a la vista (foco en el
 * campo); éxito → caja de éxito; límite o error general → aviso. Todo debajo del header sticky.
 */
export function useResponseFocus(
  state: FormState,
  refs: { form: RefObject<HTMLFormElement | null>; alert: RefObject<HTMLElement | null>; success: RefObject<HTMLElement | null> },
) {
  const { form, alert, success } = refs;
  useEffect(() => {
    if (!state.at) return;
    if (state.status === "invalid") {
      revealFirstError(form.current, alert.current, Object.keys(state.fieldErrors ?? {})[0]);
      return;
    }
    const target = state.status === "success" ? success.current : alert.current;
    target?.scrollIntoView({ block: "start" });
    target?.focus({ preventScroll: true });
  }, [state, form, alert, success]);
}

/** Avisos de estado del envío (errores, límite, error general) con textos de Forms.status. */
export function FormStatusAlerts({ state, alertRef }: { state: FormState; alertRef: RefObject<HTMLDivElement | null> }) {
  const t = useTranslations("Forms.status");
  return (
    <div ref={alertRef} tabIndex={-1} className="scroll-below-header outline-none">
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
  );
}

/** Caja de éxito enfocable; `demo` aclara que es un sitio de demostración. */
export function FormSuccess({ successRef, title, text, demo }: { successRef: RefObject<HTMLDivElement | null>; title: string; text: ReactNode; demo: ReactNode }) {
  return (
    <div ref={successRef} tabIndex={-1} data-form-success className="scroll-below-header rounded-lg bg-surface p-8 shadow-card ring-1 ring-line outline-none">
      <FormAlert tone="success" title={title}>
        {text}
      </FormAlert>
      <p className="mt-5 text-sm text-ink-muted">{demo}</p>
    </div>
  );
}
