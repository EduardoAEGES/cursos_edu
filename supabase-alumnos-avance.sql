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
-- estas tablas directamente: solo se llega por las funciones de abajo, que
-- devuelven únicamente la fila del DNI que se pide.
alter table public.alumnos enable row level security;
alter table public.avance  enable row level security;

-- ---------- fuera las versiones anteriores ----------
-- (hace falta porque cambió lo que devuelven; no toca las tablas)
drop function if exists public.entra_alumno(text, text);
drop function if exists public.lee_avance(text, text);
drop function if exists public.graba_avance(text, text, jsonb);
drop function if exists public.lista_avance(text, text);

-- ---------- 1. entrar / registrarse ----------
-- Con solo el DNI devuelve el nombre si ya existe.
-- Con el DNI y el nombre registra al alumno la primera vez.
-- Devuelve {"dni":"12345678","nombres":"APELLIDOS, Nombre","nuevo":false}
create function public.entra_alumno(p_dni text, p_nombres text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dni    text := regexp_replace(coalesce(p_dni, ''), '\D', '', 'g');
  v_nombre text;
  v_nuevo  boolean := false;
begin
  if v_dni !~ '^[0-9]{8}$' then
    raise exception 'El DNI debe tener 8 números';
  end if;

  select a.nombres into v_nombre from public.alumnos a where a.dni = v_dni;

  if v_nombre is null then
    if p_nombres is null or length(btrim(p_nombres)) < 3 then
      -- todavía no está registrado y no mandó su nombre: solo se avisa
      return jsonb_build_object('dni', v_dni, 'nombres', null, 'nuevo', true);
    end if;
    insert into public.alumnos as al (dni, nombres)
         values (v_dni, btrim(p_nombres))
    on conflict (dni) do update set visto = now()
      returning al.nombres into v_nombre;
    v_nuevo := true;
  else
    update public.alumnos a set visto = now() where a.dni = v_dni;
  end if;

  return jsonb_build_object('dni', v_dni, 'nombres', v_nombre, 'nuevo', v_nuevo);
end;
$$;

-- ---------- 2. leer el avance guardado ----------
create function public.lee_avance(p_dni text, p_clave text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select v.datos from public.avance v
      where v.dni = regexp_replace(coalesce(p_dni, ''), '\D', '', 'g')
        and v.clave = p_clave),
    '{}'::jsonb);
$$;

-- ---------- 3. guardar el avance ----------
create function public.graba_avance(p_dni text, p_clave text, p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_dni text := regexp_replace(coalesce(p_dni, ''), '\D', '', 'g');
begin
  if v_dni !~ '^[0-9]{8}$' then return jsonb_build_object('ok', false); end if;
  if p_clave is null or length(p_clave) = 0 then return jsonb_build_object('ok', false); end if;
  if not exists (select 1 from public.alumnos a where a.dni = v_dni) then
    return jsonb_build_object('ok', false);
  end if;

  insert into public.avance as av (dni, clave, datos, actualizado)
       values (v_dni, p_clave, coalesce(p_datos, '{}'::jsonb), now())
  on conflict (dni, clave) do update
    set datos = excluded.datos, actualizado = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- 4. el reporte del docente ----------
-- Pide la misma clave de docente que la página. Devuelve una lista.
create function public.lista_avance(p_clave text, p_clave_docente text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_clave_docente is distinct from '46069339' then
    raise exception 'Clave de docente incorrecta';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'dni', v.dni, 'nombres', a.nombres,
             'datos', v.datos, 'actualizado', v.actualizado)
           order by a.nombres)
      from public.avance v
      join public.alumnos a on a.dni = v.dni
     where v.clave = p_clave), '[]'::jsonb);
end;
$$;

-- ---------- permisos ----------
-- Supabase da acceso a las tablas nuevas por defecto: aquí se lo quitamos,
-- para que el DNI de los alumnos solo salga por las funciones de arriba.
revoke all on table public.alumnos from anon, authenticated;
revoke all on table public.avance  from anon, authenticated;

revoke all on function public.entra_alumno(text,text)        from public;
revoke all on function public.lee_avance(text,text)          from public;
revoke all on function public.graba_avance(text,text,jsonb)  from public;
revoke all on function public.lista_avance(text,text)        from public;

grant execute on function public.entra_alumno(text,text)       to anon, authenticated;
grant execute on function public.lee_avance(text,text)         to anon, authenticated;
grant execute on function public.graba_avance(text,text,jsonb) to anon, authenticated;
grant execute on function public.lista_avance(text,text)       to anon, authenticated;

-- Supabase recarga el catálogo de la API al terminar
notify pgrst, 'reload schema';
