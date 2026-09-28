-- Sala en vivo de la actividad "Venta de mercadería y cobro"
-- (asientos-venta-cobro.html). Pega todo esto en Supabase:
-- proyecto → SQL Editor → New query → Run.
--
-- Guarda una fila por alumno y por sala. Cada vez que el alumno
-- coloca una cuenta o escribe un importe, su fila se actualiza, y
-- todos los que están en la misma sala la ven en unos segundos.

create table if not exists public.sala_asientos (
  id           bigint generated always as identity primary key,
  sala         text not null,
  alumno       text not null,
  caso         text,
  estado       jsonb not null default '{}'::jsonb,
  actualizado  timestamptz not null default now(),
  constraint sala_asientos_unica unique (sala, alumno)
);

create index if not exists sala_asientos_por_sala
  on public.sala_asientos (sala, actualizado desc);

alter table public.sala_asientos enable row level security;

-- La página usa la llave anónima, así que necesita estas tres políticas.
drop policy if exists "lectura de la sala"     on public.sala_asientos;
drop policy if exists "alta en la sala"        on public.sala_asientos;
drop policy if exists "avance en la sala"      on public.sala_asientos;

create policy "lectura de la sala" on public.sala_asientos
  for select using (true);

create policy "alta en la sala" on public.sala_asientos
  for insert with check (true);

create policy "avance en la sala" on public.sala_asientos
  for update using (true) with check (true);

-- Para vaciar una sala al terminar la clase:
--   delete from public.sala_asientos where sala = 'PCGE';
-- (o simplemente usa otro código de sala la próxima vez)
