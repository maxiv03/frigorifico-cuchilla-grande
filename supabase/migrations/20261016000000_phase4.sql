-- ════════════════════════════════════════════════════════════════════════════
-- Fase 4 (aditiva): tipo de certificación, raza en la oferta de ganado y
-- aceptación de la política de privacidad en los formularios.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Certificaciones: dos grupos en /calidad ────────────────────────────────
-- 'certification' (HACCP, BRCGS, Halal, Kosher) o 'approval' (habilitación sanitaria
-- de un mercado: UE, Reino Unido, USDA, China).
alter table public.certifications
  add column kind text not null default 'certification'
  check (kind in ('certification', 'approval'));

-- ─── Oferta de ganado: raza (opcional) ──────────────────────────────────────
alter table public.livestock_offers
  add column breed text check (breed is null or length(breed) between 2 and 60);

-- ─── Aceptación de la política de privacidad ────────────────────────────────
-- Obligatoria en los envíos nuevos. NOT VALID: no se revalidan filas anteriores
-- (las de prueba ya purgadas o por purgar), pero toda fila nueva debe cumplirla.
alter table public.livestock_offers  add column privacy_accepted boolean not null default false;
alter table public.producer_contacts add column privacy_accepted boolean not null default false;
alter table public.quote_requests    add column privacy_accepted boolean not null default false;
alter table public.livestock_offers
  add constraint livestock_offers_privacy_accepted check (privacy_accepted) not valid;
alter table public.producer_contacts
  add constraint producer_contacts_privacy_accepted check (privacy_accepted) not valid;
alter table public.quote_requests
  add constraint quote_requests_privacy_accepted check (privacy_accepted) not valid;

-- ─── Grants: anon solo inserta, también en las columnas nuevas ──────────────
-- (las columnas nuevas no heredan grants por columna; certifications.kind se lee
-- con el grant de tabla existente).
grant insert (breed, privacy_accepted) on public.livestock_offers to anon;
grant insert (privacy_accepted) on public.producer_contacts to anon;
grant insert (privacy_accepted) on public.quote_requests to anon;
