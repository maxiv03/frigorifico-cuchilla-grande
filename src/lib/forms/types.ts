/**
 * Base de formularios (compartida por todas las Server Actions y sus formularios).
 * Los errores viajan como CÓDIGOS (+ valores) y se traducen en el cliente con
 * `Forms.errors.<código>`: la acción no depende del idioma para validar.
 */
export type FieldError = { code: FieldErrorCode; values?: Record<string, number | string> };

export type FieldErrorCode =
  | "required"
  | "tooShort"
  | "tooLong"
  | "email"
  | "phone"
  | "integer"
  | "range"
  | "option"
  | "date"
  | "dateRange"
  | "selectOne"
  | "tooMany"
  | "privacy";

export type FormState = {
  status: "idle" | "success" | "invalid" | "rate_limited" | "error";
  /** Errores por campo (status "invalid"). */
  fieldErrors?: Record<string, FieldError>;
  /** Valores enviados, para no perder lo escrito cuando hay errores. */
  values?: Record<string, string>;
  /** Cambia en cada respuesta: permite reaccionar aunque el estado se repita. */
  at?: number;
};

export const initialFormState: FormState = { status: "idle" };

/** Nombre del campo trampa (honeypot). Las personas no lo ven ni lo completan. */
export const HONEYPOT_FIELD = "website";
