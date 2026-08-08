-- Restringir la lectura pública de la tabla de registro interno de sincronización
DROP POLICY IF EXISTS "Lectura publica sync log" ON public.sync_log;
REVOKE SELECT ON public.sync_log FROM anon, authenticated;
GRANT ALL ON public.sync_log TO service_role;

-- Vista pública sin mensajes de error internos
DROP VIEW IF EXISTS public.estado_sincronizacion;
CREATE VIEW public.estado_sincronizacion
WITH (security_invoker = false) AS
  SELECT DISTINCT ON (fuente) fuente, registros, ok, ejecutado_en
  FROM public.sync_log
  ORDER BY fuente, ejecutado_en DESC;

GRANT SELECT ON public.estado_sincronizacion TO anon, authenticated;
GRANT ALL ON public.estado_sincronizacion TO service_role;