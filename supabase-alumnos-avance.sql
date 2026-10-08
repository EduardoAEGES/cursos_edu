-- =====================================================================
--  Registro del alumno por DNI y avance guardado en la nube
--  Pegar todo esto en Supabase → SQL Editor → Run.
--  Se puede volver a ejecutar las veces que haga falta: no borra datos.
-- =====================================================================

-- ---------- tablas ----------
create table if not exists public.alumnos (
  dni     text primary key,
  nombres text not null,
  creado  timestamptz not null default now(),
  visto   timestamptz not null default now()
);

create table if not exists public.avance (
  dni         text not null,
  clave       text not null,
  datos       jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (dni, clave)
);

create index if not exists avance_clave_idx on public.avance (clave, actualizado desc);

-- ---------- nadie entra por la puerta de atrás ----------
-- Con RLS encendida y sin políticas, la API pública no puede leer ni escribir
-- estas tablas directamente: solo se llega por las tres funciones de abajo.
alter table public.alumnos enable row level security;
alter table public.avance  enable row level security;

-- ---------- 1. entrar / registrarse ----------
-- Con solo el DNI devuelve el nombre si ya existe.
-- Con el DNI y el nombre registra al alumno la primera vez.
create or replace function public.entra_alumno(p_dni text, p_nombres text default null)
returns table (dni text, nombres text, nuevo boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nom   text;
  v_nuevo boolean := false;
begin
  p_dni := regexp_replace(coalesce(p_dni,''), '\D', '', 'g');
  if p_dni !~ '^[0-9]{8}$' then
    raise exception 'El DNI debe tener 8 números';
  end if;

  select a.nombres into v_nom from public.alumnos a where a.dni = p_dni;

  if v_nom is null then
    if p_nombres is null or length(btrim(p_nombres)) < 3 then
      -- todavía no está registrado y no mandó su nombre: solo se avisa
      return query select p_dni, null::text, true;
      return;
    end if;
    insert into public.alumnos (dni, nombres) values (p_dni, btrim(p_nombres))
      on conflict (dni) do update set visto = now();
    select a.nombres into v_nom from public.alumnos a where a.dni = p_dni;
    v_nuevo := true;
  else
    update public.alumnos a set visto = now() where a.dni = p_dni;
  end if;

  return query select p_dni, v_nom, v_nuevo;
end;
$$;

-- ---------- 2. leer el avance guardado ----------
create or replace function public.lee_avance(p_dni text, p_clave text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select v.datos from public.avance v
      where v.dni = regexp_replace(coalesce(p_dni,''), '\D', '', 'g')
        and v.clave = p_clave),
    '{}'::jsonb);
$$;

-- ---------- 3. guardar el avance ----------
create or replace function public.graba_avance(p_dni text, p_clave text, p_datos jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_dni text := regexp_replace(coalesce(p_dni,''), '\D', '', 'g');
begin
  if v_dni !~ '^[0-9]{8}$' then return; end if;
  if p_clave is null or length(p_clave) = 0 then return; end if;
  if not exists (select 1 from public.alumnos a where a.dni = v_dni) then return; end if;

  insert into public.avance (dni, clave, datos, actualizado)
  values (v_dni, p_clave, coalesce(p_datos, '{}'::jsonb), now())
  on conflict (dni, clave) do update
    set datos = excluded.datos, actualizado = now();
end;
$$;

-- ---------- 4. el reporte del docente ----------
-- Pide la misma clave de docente que la página. Devuelve una fila por alumno.
create or replace function public.lista_avance(p_clave text, p_clave_docente text)
returns table (dni text, nombres text, datos jsonb, actualizado timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_clave_docente is distinct from '46069339' then
    raise exception 'Clave de docente incorrecta';
  end if;
  return query
    select v.dni, a.nombres, v.datos, v.actualizado
      from public.avance v
      join public.alumnos a on a.dni = v.dni
     where v.clave = p_clave
     order by a.nombres;
end;
$$;

-- ---------- permisos ----------
revoke all on function public.entra_alumno(text,text)        from public;
revoke all on function public.lee_avance(text,text)          from public;
revoke all on function public.graba_avance(text,text,jsonb)  from public;
revoke all on function public.lista_avance(text,text)        from public;

grant execute on function public.entra_alumno(text,text)       to anon, authenticated;
grant execute on function public.lee_avance(text,text)         to anon, authenticated;
grant execute on function public.graba_avance(text,text,jsonb) to anon, authenticated;
grant execute on function public.lista_avance(text,text)       to anon, authenticated;
