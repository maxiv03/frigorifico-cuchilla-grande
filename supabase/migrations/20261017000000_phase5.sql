-- ════════════════════════════════════════════════════════════════════════════
-- Fase 5 (aditiva): datos estructurados del pedido de cotización, motivo del
-- contacto de productores y tema/año de base de las metas de sostenibilidad.
-- Las columnas nuevas obligatorias se exigen con checks NOT VALID: no se revalidan
-- filas anteriores, pero todo envío nuevo debe cumplirlos.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Pedido de cotización ───────────────────────────────────────────────────
-- cuts_of_interest (texto) se sigue llenando con los ids; cut_ids es la lista estructurada.
alter table public.quote_requests
  add column cut_ids          text[] check (cut_ids is null or cardinality(cut_ids) between 1 and 20),
  add column volume_amount    numeric(8,1) check (volume_amount is null or volume_amount > 0),
  add column volume_unit      text check (volume_unit is null or volume_unit in ('tonnes_month', 'containers_month')),
  add column incoterm         text check (incoterm is null or incoterm in ('FOB', 'CFR', 'CIF')),
  add column destination_port text check (destination_port is null or length(destination_port) between 2 and 80);
alter table public.quote_requests
  add constraint quote_requests_structured_required
  check (cut_ids is not null and volume_amount is not null and volume_unit is not null) not valid;

-- ─── Contacto de productores: motivo ────────────────────────────────────────
alter table public.producer_contacts
  add column reason text check (reason is null or reason in ('sell', 'settlement', 'other'));
alter table public.producer_contacts
  add constraint producer_contacts_reason_required check (reason is not null) not valid;

-- ─── Metas de sostenibilidad: tema (pestaña) y año de la línea de base ──────
alter table public.sustainability_goals
  add column topic text check (topic is null or topic in ('energy', 'water', 'emissions', 'animal_welfare', 'community')),
  add column baseline_year int check (baseline_year is null or baseline_year between 2000 and 2050);

-- ─── Grants: anon solo inserta, también en las columnas nuevas ──────────────
-- (las columnas nuevas no heredan grants por columna; las de sustainability_goals se leen con
-- el grant de tabla existente).
grant insert (cut_ids, volume_amount, volume_unit, incoterm, destination_port) on public.quote_requests to anon;
grant insert (reason) on public.producer_contacts to anon;
