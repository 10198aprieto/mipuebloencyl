CREATE TABLE public.municipio_geografia (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_ine integer NOT NULL,
  latitud double precision,
  longitud double precision,
  altitud_m numeric,
  superficie_km2 numeric,
  nucleo_referencia text,
  fuente_coordenadas text,
  fuente_altitud text,
  fuente_superficie text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.municipio_geografia TO anon, authenticated;
GRANT ALL ON public.municipio_geografia TO service_role;
ALTER TABLE public.municipio_geografia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica geografia" ON public.municipio_geografia FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.municipio_agro (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_ine integer NOT NULL,
  anyo integer,
  explotaciones numeric,
  sau_hectareas numeric,
  unidades_ganaderas numeric,
  fuente text NOT NULL DEFAULT 'INE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.municipio_agro TO anon, authenticated;
GRANT ALL ON public.municipio_agro TO service_role;
ALTER TABLE public.municipio_agro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica agro" ON public.municipio_agro FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.municipio_poblacion_historica (
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_ine integer NOT NULL,
  anyo integer NOT NULL,
  poblacion integer,
  fuente text NOT NULL DEFAULT 'wikidata',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (municipio_id, anyo)
);
CREATE INDEX municipio_poblacion_historica_cod_ine_idx ON public.municipio_poblacion_historica (cod_ine, anyo);
GRANT SELECT ON public.municipio_poblacion_historica TO anon, authenticated;
GRANT ALL ON public.municipio_poblacion_historica TO service_role;
ALTER TABLE public.municipio_poblacion_historica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica poblacion historica" ON public.municipio_poblacion_historica FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.municipio_imagenes (
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  cod_ine integer NOT NULL,
  tipo text NOT NULL,
  url text NOT NULL,
  url_thumb text,
  archivo text,
  pagina_descripcion text,
  licencia text,
  licencia_url text,
  autor text,
  fuente text NOT NULL DEFAULT 'wikidata+commons',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (municipio_id, tipo)
);
GRANT SELECT ON public.municipio_imagenes TO anon, authenticated;
GRANT ALL ON public.municipio_imagenes TO service_role;
ALTER TABLE public.municipio_imagenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica imagenes" ON public.municipio_imagenes FOR SELECT TO anon, authenticated USING (true);
