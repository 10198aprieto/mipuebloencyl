REVOKE EXECUTE ON FUNCTION public.recalcular_datos_curiosos() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalcular_indice_servicios() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calcular_calidad_aire() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calcular_transporte() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_municipios_geom(jsonb) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalcular_datos_curiosos() TO service_role;