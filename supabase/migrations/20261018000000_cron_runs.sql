-- ════════════════════════════════════════════════════════════════════════════
-- Fase 6 (aditiva): registro de ejecuciones del cron diario.
-- Vercel Hobby retiene los logs menos de una hora y Supabase gratis, 24 horas: sin este
-- registro no hay forma de verificar que el cron corrió todos los días.
-- Solo lo escribe el cron (clave secreta); anon no tiene ningún permiso.
-- ════════════════════════════════════════════════════════════════════════════
create table public.cron_runs (
  id               bigint generated always as identity primary key,
  ran_at           timestamptz not null default now(),
  current_monday   date not null,
  inserted_quotes  int not null default 0 check (inserted_quotes >= 0),
  purged           jsonb not null default '{}'::jsonb,
  ok               boolean not null default true
);
create index cron_runs_ran_at on public.cron_runs (ran_at desc);

alter table public.cron_runs enable row level security;
revoke all on public.cron_runs from anon, authenticated;
