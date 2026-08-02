CREATE OR REPLACE FUNCTION public.recalcular_indice_servicios()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE n integer; max_edu numeric; max_sal numeric;
BEGIN
  SELECT greatest(coalesce(max(num_centros),0),1) INTO max_edu FROM public.servicios_educacion;
  SELECT greatest(coalesce(max(num_centros_salud + num_hospitales_consultorios),0),1) INTO max_sal FROM public.servicios_salud;

  INSERT INTO public.indice_servicios (municipio_id, sub_educacion, sub_salud, sub_transporte, sub_aire, indice_calculado, updated_at)
  SELECT m.id,
    round(e_sub, 4), round(s_sub, 4), round(t_sub, 4), round(a_sub, 4),
    round(100 * (0.30*e_sub + 0.30*s_sub + 0.25*t_sub + 0.15*a_sub), 1),
    now()
  FROM public.municipios m
  CROSS JOIN LATERAL (
    SELECT
      least(1, ln(1 + coalesce((SELECT num_centros FROM public.servicios_educacion WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_edu)) AS e_sub,
      least(1, ln(1 + coalesce((SELECT num_centros_salud + num_hospitales_consultorios FROM public.servicios_salud WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_sal)) AS s_sub,
      greatest(0, 1 - least(1, coalesce((SELECT distancia_km FROM public.transporte_municipio WHERE municipio_id = m.id), 60)::numeric / 60)) AS t_sub,
      greatest(0, 1 - least(1, coalesce((SELECT ultimo_valor FROM public.calidad_aire_municipio WHERE municipio_id = m.id), 25)::numeric / 50)) AS a_sub
  ) sub
  ON CONFLICT (municipio_id) DO UPDATE
    SET sub_educacion = EXCLUDED.sub_educacion,
        sub_salud = EXCLUDED.sub_salud,
        sub_transporte = EXCLUDED.sub_transporte,
        sub_aire = EXCLUDED.sub_aire,
        indice_calculado = EXCLUDED.indice_calculado,
        updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

REVOKE ALL ON FUNCTION public.recalcular_indice_servicios() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalcular_indice_servicios() TO service_role;