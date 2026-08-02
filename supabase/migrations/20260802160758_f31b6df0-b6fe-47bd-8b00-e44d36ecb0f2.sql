ALTER FUNCTION public.norm_txt(text) SET search_path = public;

REVOKE ALL ON FUNCTION public.calcular_transporte() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calcular_calidad_aire() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalcular_indice_servicios() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_geom_from_latlon() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.calcular_transporte() TO service_role;
GRANT EXECUTE ON FUNCTION public.calcular_calidad_aire() TO service_role;
GRANT EXECUTE ON FUNCTION public.recalcular_indice_servicios() TO service_role;