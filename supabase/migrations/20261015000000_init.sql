-- ════════════════════════════════════════════════════════════════════════════
-- Frigorífico Cuchilla Grande — esquema inicial
-- Contenido bilingüe (tabla base + *_translations), precios de hacienda y
-- formularios. El rol anon solo LEE contenido e INSERTA en formularios.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Permisos por defecto: cerrar todo antes de crear nada ──────────────────
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- ─── Idiomas ────────────────────────────────────────────────────────────────
create table public.locales (
  code        text primary key check (code ~ '^[a-z]{2}$'),
  name        text not null,
  is_default  boolean not null default false,
  sort        int not null default 0
);
create unique index locales_single_default on public.locales (is_default) where is_default;

-- ─── Certificaciones ────────────────────────────────────────────────────────
create table public.certifications (
  id    text primary key,
  icon  text not null,
  sort  int not null default 0
);
create table public.certification_translations (
  certification_id text not null references public.certifications(id) on delete cascade,
  locale           text not null references public.locales(code),
  name             text not null check (length(name) between 1 and 80),
  summary          text not null check (length(summary) between 1 and 600),
  primary key (certification_id, locale)
);

-- ─── Mercados ───────────────────────────────────────────────────────────────
create table public.markets (
  id             text primary key,
  lat            double precision not null,
  lng            double precision not null,
  share_pct      numeric(4,1) not null check (share_pct between 0 and 100),
  volume_tonnes  int not null check (volume_tonnes >= 0),
  sort           int not null default 0
);
create table public.market_translations (
  market_id    text not null references public.markets(id) on delete cascade,
  locale       text not null references public.locales(code),
  name         text not null check (length(name) between 1 and 80),
  description  text not null check (length(description) between 1 and 800),
  primary key (market_id, locale)
);
create table public.market_certifications (
  market_id        text not null references public.markets(id) on delete cascade,
  certification_id text not null references public.certifications(id) on delete cascade,
  primary key (market_id, certification_id)
);

-- ─── Catálogo de cortes ─────────────────────────────────────────────────────
create table public.cut_zones (
  id       text primary key,
  species  text not null check (species in ('beef', 'lamb')),
  sort     int not null default 0,
  unique (id, species)
);
create table public.cut_zone_translations (
  zone_id  text not null references public.cut_zones(id) on delete cascade,
  locale   text not null references public.locales(code),
  name     text not null check (length(name) between 1 and 80),
  primary key (zone_id, locale)
);
create table public.cuts (
  id             text primary key,
  species        text not null check (species in ('beef', 'lamb')),
  zone_id        text not null,
  bone           text not null check (bone in ('bone_in', 'boneless')),
  presentations  text[] not null check (
    cardinality(presentations) > 0 and presentations <@ array['chilled', 'frozen']
  ),
  image          text,
  featured       boolean not null default false,
  sort           int not null default 0,
  unique (id, species),
  foreign key (zone_id, species) references public.cut_zones(id, species)
);
create table public.cut_translations (
  cut_id       text not null,
  species      text not null,
  locale       text not null references public.locales(code),
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (length(name) between 1 and 80),
  -- Nombre alternativo (en inglés: término de consumidor). Búsqueda usa name y alias.
  alias        text check (alias is null or length(alias) between 1 and 80),
  description  text not null check (length(description) between 1 and 800),
  primary key (cut_id, locale),
  unique (locale, species, slug),
  foreign key (cut_id, species) references public.cuts(id, species) on delete cascade
);
create table public.cut_markets (
  cut_id     text not null references public.cuts(id) on delete cascade,
  market_id  text not null references public.markets(id) on delete cascade,
  primary key (cut_id, market_id)
);

-- ─── Noticias ───────────────────────────────────────────────────────────────
create table public.news_posts (
  id            text primary key,
  published_at  date not null,
  image         text,
  featured      boolean not null default false
);
create table public.news_translations (
  post_id  text not null references public.news_posts(id) on delete cascade,
  locale   text not null references public.locales(code),
  slug     text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title    text not null check (length(title) between 1 and 160),
  excerpt  text not null check (length(excerpt) between 1 and 400),
  body_md  text not null check (length(body_md) between 1 and 20000),
  primary key (post_id, locale),
  unique (locale, slug)
);

-- ─── Sostenibilidad ─────────────────────────────────────────────────────────
create table public.sustainability_goals (
  id           text primary key,
  pillar       text not null check (pillar in ('environment', 'animal_welfare', 'people', 'community')),
  unit         text not null,
  baseline     numeric not null,
  target       numeric not null,
  current      numeric not null,
  target_year  int not null check (target_year between 2020 and 2050),
  status       text not null check (status in ('achieved', 'on_track', 'in_progress', 'at_risk')),
  sort         int not null default 0
);
create table public.sustainability_goal_translations (
  goal_id      text not null references public.sustainability_goals(id) on delete cascade,
  locale       text not null references public.locales(code),
  title        text not null check (length(title) between 1 and 160),
  description  text not null check (length(description) between 1 and 800),
  primary key (goal_id, locale)
);

-- ─── Precios de referencia de hacienda ──────────────────────────────────────
create table public.price_categories (
  id          text primary key,
  species     text not null check (species in ('beef', 'lamb')),
  base_price  numeric(5,2) not null check (base_price > 0),  -- US$/kg carcasa, ancla de la rotación
  yield_pct   numeric(4,1) not null check (yield_pct between 30 and 70),
  sort        int not null default 0
);
create table public.price_category_translations (
  category_id  text not null references public.price_categories(id) on delete cascade,
  locale       text not null references public.locales(code),
  name         text not null check (length(name) between 1 and 60),
  primary key (category_id, locale)
);
create table public.price_quotes (
  category_id   text not null references public.price_categories(id) on delete cascade,
  week_start    date not null check (extract(isodow from week_start) = 1),  -- lunes
  price_usd_kg  numeric(5,2) not null check (price_usd_kg > 0),
  primary key (category_id, week_start)
);

-- Pizarra vigente: última semana y variación contra la anterior.
create view public.price_board with (security_invoker = true) as
select
  q.category_id,
  q.week_start,
  q.price_usd_kg,
  prev.price_usd_kg as previous_price_usd_kg,
  round((q.price_usd_kg - prev.price_usd_kg) / prev.price_usd_kg * 100, 2) as change_pct
from public.price_quotes q
left join lateral (
  select p.price_usd_kg from public.price_quotes p
  where p.category_id = q.category_id and p.week_start < q.week_start
  order by p.week_start desc limit 1
) prev on true
where q.week_start = (select max(week_start) from public.price_quotes);

-- ─── Formularios (anon: solo INSERT) ────────────────────────────────────────
create table public.quote_requests (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  env               text not null check (env in ('development', 'preview', 'production')),
  locale            text not null references public.locales(code),
  ip_hash           text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  company           text not null check (length(company) between 2 and 120),
  contact_name      text not null check (length(contact_name) between 2 and 120),
  email             text not null check (length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text check (phone is null or length(phone) between 6 and 30),
  country           text not null check (length(country) between 2 and 80),
  cuts_of_interest  text not null check (length(cuts_of_interest) between 1 and 600),
  volume            text not null check (length(volume) between 1 and 120),
  presentation      text not null check (presentation in ('chilled', 'frozen', 'both')),
  message           text check (message is null or length(message) <= 2000)
);

create table public.producer_contacts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  env         text not null check (env in ('development', 'preview', 'production')),
  locale      text not null references public.locales(code),
  ip_hash     text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  name        text not null check (length(name) between 2 and 120),
  phone       text not null check (length(phone) between 6 and 30),
  email       text check (email is null or (length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  department  text not null check (length(department) between 2 and 40),
  message     text not null check (length(message) between 1 and 2000)
);

create table public.livestock_offers (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  env             text not null check (env in ('development', 'preview', 'production')),
  locale          text not null references public.locales(code),
  ip_hash         text not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  category_id     text not null references public.price_categories(id),
  head_count      int not null check (head_count between 1 and 5000),
  avg_weight_kg   int not null check (avg_weight_kg between 20 and 900),
  department      text not null check (length(department) between 2 and 40),
  available_from  date not null,
  name            text not null check (length(name) between 2 and 120),
  phone           text not null check (length(phone) between 6 and 30),
  email           text check (email is null or (length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  notes           text check (notes is null or length(notes) <= 2000)
);

create index quote_requests_rate    on public.quote_requests    (ip_hash, created_at);
create index producer_contacts_rate on public.producer_contacts (ip_hash, created_at);
create index livestock_offers_rate  on public.livestock_offers  (ip_hash, created_at);

-- Límite de envíos: 5 por IP cada 10 minutos y 300 por tabla por hora.
create function public.enforce_form_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  per_ip int;
  per_table int;
begin
  execute format(
    'select count(*) from %I.%I where ip_hash = $1 and created_at > now() - interval ''10 minutes''',
    tg_table_schema, tg_table_name) into per_ip using new.ip_hash;
  if per_ip >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  execute format(
    'select count(*) from %I.%I where created_at > now() - interval ''1 hour''',
    tg_table_schema, tg_table_name) into per_table;
  if per_table >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
revoke execute on function public.enforce_form_rate_limit() from public, anon, authenticated;

create trigger quote_requests_rate_limit    before insert on public.quote_requests
  for each row execute function public.enforce_form_rate_limit();
create trigger producer_contacts_rate_limit before insert on public.producer_contacts
  for each row execute function public.enforce_form_rate_limit();
create trigger livestock_offers_rate_limit  before insert on public.livestock_offers
  for each row execute function public.enforce_form_rate_limit();

-- ─── RLS en todas las tablas ────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'locales', 'certifications', 'certification_translations',
    'markets', 'market_translations', 'market_certifications',
    'cut_zones', 'cut_zone_translations', 'cuts', 'cut_translations', 'cut_markets',
    'news_posts', 'news_translations',
    'sustainability_goals', 'sustainability_goal_translations',
    'price_categories', 'price_category_translations', 'price_quotes',
    'quote_requests', 'producer_contacts', 'livestock_offers'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ─── Grants explícitos ──────────────────────────────────────────────────────
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Contenido: lectura pública.
do $$
declare t text;
begin
  foreach t in array array[
    'locales', 'certifications', 'certification_translations',
    'markets', 'market_translations', 'market_certifications',
    'cut_zones', 'cut_zone_translations', 'cuts', 'cut_translations', 'cut_markets',
    'news_posts', 'news_translations',
    'sustainability_goals', 'sustainability_goal_translations',
    'price_categories', 'price_category_translations', 'price_quotes'
  ] loop
    execute format('grant select on public.%I to anon', t);
    execute format('create policy "public read" on public.%I for select to anon using (true)', t);
  end loop;
end $$;
grant select on public.price_board to anon;

-- Formularios: solo INSERT y solo en las columnas que llena el usuario
-- (id y created_at quedan fuera: el límite de envíos no se puede burlar).
grant insert (env, locale, ip_hash, company, contact_name, email, phone, country,
              cuts_of_interest, volume, presentation, message)
  on public.quote_requests to anon;
grant insert (env, locale, ip_hash, name, phone, email, department, message)
  on public.producer_contacts to anon;
grant insert (env, locale, ip_hash, category_id, head_count, avg_weight_kg, department,
              available_from, name, phone, email, notes)
  on public.livestock_offers to anon;

create policy "anon insert" on public.quote_requests    for insert to anon with check (true);
create policy "anon insert" on public.producer_contacts for insert to anon with check (true);
create policy "anon insert" on public.livestock_offers  for insert to anon with check (true);
