-- 1. Geometría de límites municipales en la tabla existente
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS geom_poly extensions.geometry(MultiPolygon, 4326);
CREATE INDEX IF NOT EXISTS municipios_geom_poly_idx ON public.municipios USING GIST (geom_poly);

CREATE OR REPLACE FUNCTION public.set_municipios_geom(_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE n integer := 0; r jsonb;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    UPDATE public.municipios
       SET geom_poly = extensions.ST_Multi(extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(r->>'geojson'), 4326)),
           updated_at = now()
     WHERE cod_ine = (r->>'cod_ine')::integer;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END; $$;
REVOKE ALL ON FUNCTION public.set_municipios_geom(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_municipios_geom(jsonb) TO service_role;

-- GeoJSON simplificado para el mapa choropleth
CREATE OR REPLACE FUNCTION public.municipios_geojson()
RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public','extensions' AS $$
  SELECT jsonb_build_object(
    'type','FeatureCollection',
    'features', coalesce(jsonb_agg(jsonb_build_object(
      'type','Feature',
      'id', m.id,
      'properties', jsonb_build_object('id', m.id, 'nombre', m.nombre, 'provincia', m.provincia),
      'geometry', extensions.ST_AsGeoJSON(extensions.ST_SimplifyPreserveTopology(m.geom_poly, 0.0015), 5)::jsonb
    )), '[]'::jsonb)
  )
  FROM public.municipios m WHERE m.geom_poly IS NOT NULL;
$$;
GRANT EXECUTE ON FUNCTION public.municipios_geojson() TO anon, authenticated, service_role;

-- 2. Cultura y ocio
CREATE TABLE IF NOT EXISTS public.servicios_cultura_ocio (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_bibliotecas_bibliobuses integer NOT NULL DEFAULT 0,
  num_museos integer NOT NULL DEFAULT 0,
  tiene_fiestas_registradas boolean NOT NULL DEFAULT false,
  proxima_fiesta date,
  nombre_proxima_fiesta text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios_cultura_ocio TO anon, authenticated;
GRANT ALL ON public.servicios_cultura_ocio TO service_role;
ALTER TABLE public.servicios_cultura_ocio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica cultura" ON public.servicios_cultura_ocio FOR SELECT TO anon, authenticated USING (true);

-- 3. Comercio
CREATE TABLE IF NOT EXISTS public.servicios_comercio (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_establecimientos_comerciales integer NOT NULL DEFAULT 0,
  num_servicios_proximidad integer NOT NULL DEFAULT 0,
  num_colaboradores_carnet_joven integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios_comercio TO anon, authenticated;
GRANT ALL ON public.servicios_comercio TO service_role;
ALTER TABLE public.servicios_comercio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica comercio" ON public.servicios_comercio FOR SELECT TO anon, authenticated USING (true);

-- 4. Contexto económico provincial
CREATE TABLE IF NOT EXISTS public.contexto_economico_provincia (
  provincia text PRIMARY KEY,
  provincia_norm text,
  fecha date,
  parados_total integer,
  parados_mujer integer,
  parados_varon integer,
  tasa_paro numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contexto_economico_provincia TO anon, authenticated;
GRANT ALL ON public.contexto_economico_provincia TO service_role;
ALTER TABLE public.contexto_economico_provincia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica paro" ON public.contexto_economico_provincia FOR SELECT TO anon, authenticated USING (true);

-- 5. Colegios profesionales
CREATE TABLE IF NOT EXISTS public.colegios_profesionales_municipio (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_colegios_profesionales integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.colegios_profesionales_municipio TO anon, authenticated;
GRANT ALL ON public.colegios_profesionales_municipio TO service_role;
ALTER TABLE public.colegios_profesionales_municipio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica colegios" ON public.colegios_profesionales_municipio FOR SELECT TO anon, authenticated USING (true);

-- 6. Servicios sociales
CREATE TABLE IF NOT EXISTS public.servicios_sociales (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_centros_caracter_social integer NOT NULL DEFAULT 0,
  num_servicios_caracter_social integer NOT NULL DEFAULT 0,
  num_servicios_proximidad integer NOT NULL DEFAULT 0,
  num_puntos_donacion integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios_sociales TO anon, authenticated;
GRANT ALL ON public.servicios_sociales TO service_role;
ALTER TABLE public.servicios_sociales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica sociales" ON public.servicios_sociales FOR SELECT TO anon, authenticated USING (true);

-- 7. Movilidad y vehículos
CREATE TABLE IF NOT EXISTS public.servicios_movilidad_vehiculos (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_centros_itv integer NOT NULL DEFAULT 0,
  num_puntos_recarga_electrica integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.servicios_movilidad_vehiculos TO anon, authenticated;
GRANT ALL ON public.servicios_movilidad_vehiculos TO service_role;
ALTER TABLE public.servicios_movilidad_vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica movilidad" ON public.servicios_movilidad_vehiculos FOR SELECT TO anon, authenticated USING (true);

-- 8. Ampliación de salud
ALTER TABLE public.servicios_salud
  ADD COLUMN IF NOT EXISTS num_farmacias integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS area_salud text,
  ADD COLUMN IF NOT EXISTS centro_salud_referencia text;

-- 9. Índice por subíndices 0-100
ALTER TABLE public.indice_servicios
  ADD COLUMN IF NOT EXISTS sub_movilidad numeric,
  ADD COLUMN IF NOT EXISTS sub_social numeric,
  ADD COLUMN IF NOT EXISTS sub_cultura numeric,
  ADD COLUMN IF NOT EXISTS sub_comercio numeric;

CREATE OR REPLACE FUNCTION public.recalcular_indice_servicios()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE n integer;
  max_edu numeric; max_sal numeric; max_cul numeric; max_soc numeric; max_com numeric; max_mov numeric;
BEGIN
  SELECT greatest(coalesce(max(num_centros),0),1)::numeric INTO max_edu FROM public.servicios_educacion;
  SELECT greatest(coalesce(max(num_centros_salud + num_hospitales_consultorios + num_farmacias),0),1)::numeric INTO max_sal FROM public.servicios_salud;
  SELECT greatest(coalesce(max(num_bibliotecas_bibliobuses + num_museos),0),1)::numeric INTO max_cul FROM public.servicios_cultura_ocio;
  SELECT greatest(coalesce(max(num_centros_caracter_social + num_servicios_caracter_social + num_servicios_proximidad + num_puntos_donacion),0),1)::numeric INTO max_soc FROM public.servicios_sociales;
  SELECT greatest(coalesce(max(num_establecimientos_comerciales + num_servicios_proximidad),0),1)::numeric INTO max_com FROM public.servicios_comercio;
  SELECT greatest(coalesce(max(num_centros_itv + num_puntos_recarga_electrica),0),1)::numeric INTO max_mov FROM public.servicios_movilidad_vehiculos;

  INSERT INTO public.indice_servicios (municipio_id, sub_educacion, sub_salud, sub_transporte, sub_aire, sub_movilidad, sub_social, sub_cultura, sub_comercio, indice_calculado, updated_at)
  SELECT m.id,
    round(100*e_sub,1), round(100*s_sub,1), round(100*t_sub,1), round(100*a_sub,1),
    round(100*(0.6*t_sub + 0.4*mv_sub),1),
    round(100*so_sub,1), round(100*c_sub,1), round(100*co_sub,1),
    round(100*(0.22*e_sub + 0.28*s_sub + 0.20*(0.6*t_sub + 0.4*mv_sub) + 0.12*so_sub + 0.10*c_sub + 0.08*co_sub),1),
    now()
  FROM public.municipios m
  CROSS JOIN LATERAL (
    SELECT
      least(1, ln(1 + coalesce((SELECT num_centros FROM public.servicios_educacion WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_edu)) AS e_sub,
      least(1, ln(1 + coalesce((SELECT num_centros_salud + num_hospitales_consultorios + num_farmacias FROM public.servicios_salud WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_sal)) AS s_sub,
      greatest(0, 1 - least(1, coalesce((SELECT distancia_km FROM public.transporte_municipio WHERE municipio_id = m.id), 60)::numeric / 60)) AS t_sub,
      greatest(0, 1 - least(1, coalesce((SELECT ultimo_valor FROM public.calidad_aire_municipio WHERE municipio_id = m.id), 25)::numeric / 50)) AS a_sub,
      least(1, ln(1 + coalesce((SELECT num_centros_itv + num_puntos_recarga_electrica FROM public.servicios_movilidad_vehiculos WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_mov)) AS mv_sub,
      least(1, ln(1 + coalesce((SELECT num_centros_caracter_social + num_servicios_caracter_social + num_servicios_proximidad + num_puntos_donacion FROM public.servicios_sociales WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_soc)) AS so_sub,
      least(1, ln(1 + coalesce((SELECT num_bibliotecas_bibliobuses + num_museos FROM public.servicios_cultura_ocio WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_cul)) AS c_sub,
      least(1, ln(1 + coalesce((SELECT num_establecimientos_comerciales + num_servicios_proximidad FROM public.servicios_comercio WHERE municipio_id = m.id),0)::numeric) / ln(1 + max_com)) AS co_sub
  ) sub
  ON CONFLICT (municipio_id) DO UPDATE
    SET sub_educacion = EXCLUDED.sub_educacion, sub_salud = EXCLUDED.sub_salud,
        sub_transporte = EXCLUDED.sub_transporte, sub_aire = EXCLUDED.sub_aire,
        sub_movilidad = EXCLUDED.sub_movilidad, sub_social = EXCLUDED.sub_social,
        sub_cultura = EXCLUDED.sub_cultura, sub_comercio = EXCLUDED.sub_comercio,
        indice_calculado = EXCLUDED.indice_calculado, updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

-- Asignación de puntos sueltos (recarga, donación) al municipio que los contiene o al más cercano
CREATE OR REPLACE FUNCTION public.municipio_por_punto(_lat double precision, _lon double precision)
RETURNS uuid LANGUAGE sql STABLE SET search_path TO 'public','extensions' AS $$
  SELECT m.id FROM public.municipios m
  WHERE m.geom IS NOT NULL
  ORDER BY m.geom <-> extensions.ST_SetSRID(extensions.ST_MakePoint(_lon, _lat), 4326)::extensions.geography
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.municipio_por_punto(double precision, double precision) TO service_role;