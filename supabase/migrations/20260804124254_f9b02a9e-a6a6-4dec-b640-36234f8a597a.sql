CREATE TYPE public.tipo_sugerencia AS ENUM ('dato_incorrecto','dato_que_falta','otro');
CREATE TYPE public.estado_sugerencia AS ENUM ('nueva','revisada','aplicada');

CREATE TABLE public.sugerencias_datos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  tipo public.tipo_sugerencia NOT NULL DEFAULT 'otro',
  mensaje text NOT NULL,
  contacto text,
  estado public.estado_sugerencia NOT NULL DEFAULT 'nueva',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.sugerencias_datos TO anon, authenticated;
GRANT ALL ON public.sugerencias_datos TO service_role;

ALTER TABLE public.sugerencias_datos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede enviar sugerencias"
  ON public.sugerencias_datos FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(mensaje)) BETWEEN 5 AND 2000
    AND (contacto IS NULL OR length(contacto) <= 200)
  );

CREATE INDEX idx_sugerencias_estado ON public.sugerencias_datos (estado, created_at DESC);

CREATE OR REPLACE VIEW public.estado_sincronizacion
WITH (security_invoker = true) AS
SELECT DISTINCT ON (fuente) fuente, registros, ok, mensaje, ejecutado_en
FROM public.sync_log
ORDER BY fuente, ejecutado_en DESC;

GRANT SELECT ON public.estado_sincronizacion TO anon, authenticated, service_role;