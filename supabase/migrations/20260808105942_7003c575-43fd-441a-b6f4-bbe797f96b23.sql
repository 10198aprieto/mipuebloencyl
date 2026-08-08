CREATE POLICY "Lectura publica estado sync" ON public.sync_log
  FOR SELECT TO anon, authenticated USING (true);

REVOKE SELECT ON public.sync_log FROM anon, authenticated;
GRANT SELECT (fuente, registros, ok, ejecutado_en) ON public.sync_log TO anon, authenticated;

DROP VIEW IF EXISTS public.estado_sincronizacion;
CREATE VIEW public.estado_sincronizacion
WITH (security_invoker = true) AS
  SELECT DISTINCT ON (fuente) fuente, registros, ok, ejecutado_en
  FROM public.sync_log
  ORDER BY fuente, ejecutado_en DESC;

GRANT SELECT ON public.estado_sincronizacion TO anon, authenticated;
GRANT ALL ON public.estado_sincronizacion TO service_role;