-- =====================================================================
--  Sacar de la sala a quien no es de la clase
--  Pegar en Supabase → SQL Editor → Run. Se puede repetir sin problema.
--
--  Borra la fila del alumno en la sala en vivo. No toca su registro de la
--  tabla alumnos ni su avance de la tabla avance: si vuelve a entrar con su
--  DNI, recupera todo. Solo lo hace quien tenga la clave de docente.
-- =====================================================================

drop function if exists public.saca_alumno(text, text, text);

create function public.saca_alumno(p_sala text, p_alumno text, p_clave_docente text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_n integer;
begin
  if p_clave_docente is distinct from '46069339' then
    raise exception 'Clave de docente incorrecta';
  end if;
  if p_sala is null or p_alumno is null then
    return jsonb_build_object('ok', false, 'borradas', 0);
  end if;

  delete from public.sala_asientos s
   where s.sala = p_sala and s.alumno = p_alumno;
  get diagnostics v_n = row_count;

  return jsonb_build_object('ok', true, 'borradas', v_n);
end;
$$;

revoke all on function public.saca_alumno(text,text,text) from public;
grant execute on function public.saca_alumno(text,text,text) to anon, authenticated;

notify pgrst, 'reload schema';
