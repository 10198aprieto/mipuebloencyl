CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.norm_txt(t text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT upper(btrim(translate(coalesce(t,''), 'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙçÇ', 'aeiouunAEIOUUNaeiouAEIOUcC')))
$$;

CREATE TABLE public.municipios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_ine integer NOT NULL UNIQUE,
  cod_municipio text,
  nombre text NOT NULL,
  nombre_norm text GENERATED ALWAYS AS (public.norm_txt(nombre)) STORED,
  provincia text NOT NULL,
  provincia_norm text GENERATED ALWAYS AS (public.norm_txt(provincia)) STORED,
  cod_provincia text,
  latitud double precision,
  longitud double precision,
  poblacion integer,
  geom extensions.geography(Point,4326),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX municipios_nombre_norm_idx ON public.municipios (nombre_norm);
CREATE INDEX municipios_provincia_idx ON public.municipios (provincia_norm);
CREATE INDEX municipios_geom_idx ON public.municipios USING gist (geom);

CREATE TABLE public.servicios_educacion (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_centros integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.servicios_salud (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  num_centros_salud integer NOT NULL DEFAULT 0,
  num_hospitales_consultorios integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.estaciones_autobus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  provincia text,
  direccion text,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  geom extensions.geography(Point,4326),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nombre, provincia)
);
CREATE INDEX estaciones_autobus_geom_idx ON public.estaciones_autobus USING gist (geom);

CREATE TABLE public.estaciones_aire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  provincia text,
  localizacion text,
  operativa boolean,
  latitud double precision NOT NULL,
  longitud double precision NOT NULL,
  geom extensions.geography(Point,4326),
  ultimo_valor numeric,
  contaminante text,
  fecha_dato date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX estaciones_aire_geom_idx ON public.estaciones_aire USING gist (geom);

CREATE TABLE public.transporte_municipio (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  estacion_autobus_mas_cercana text,
  distancia_km numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.calidad_aire_municipio (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  estacion_mas_cercana text,
  distancia_km numeric,
  ultimo_valor numeric,
  contaminante text,
  fecha_dato date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.indice_servicios (
  municipio_id uuid PRIMARY KEY REFERENCES public.municipios(id) ON DELETE CASCADE,
  indice_calculado numeric,
  sub_educacion numeric,
  sub_salud numeric,
  sub_transporte numeric,
  sub_aire numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente text NOT NULL UNIQUE,
  registros integer,
  ok boolean NOT NULL DEFAULT true,
  mensaje text,
  ejecutado_en timestamptz NOT NULL DEFAULT now()
);

-- Geometry keepers
CREATE OR REPLACE FUNCTION public.set_geom_from_latlon()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, extensions AS $$
BEGIN
  IF NEW.latitud IS NOT NULL AND NEW.longitud IS NOT NULL THEN
    NEW.geom := extensions.ST_SetSRID(extensions.ST_MakePoint(NEW.longitud, NEW.latitud), 4326)::extensions.geography;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER municipios_geom BEFORE INSERT OR UPDATE ON public.municipios
  FOR EACH ROW EXECUTE FUNCTION public.set_geom_from_latlon();
CREATE TRIGGER estaciones_autobus_geom BEFORE INSERT OR UPDATE ON public.estaciones_autobus
  FOR EACH ROW EXECUTE FUNCTION public.set_geom_from_latlon();
CREATE TRIGGER estaciones_aire_geom BEFORE INSERT OR UPDATE ON public.estaciones_aire
  FOR EACH ROW EXECUTE FUNCTION public.set_geom_from_latlon();

-- Nearest-neighbour computations (PostGIS)
CREATE OR REPLACE FUNCTION public.calcular_transporte()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.transporte_municipio (municipio_id, estacion_autobus_mas_cercana, distancia_km, updated_at)
  SELECT m.id, e.nombre, round((extensions.ST_Distance(m.geom, e.geom)/1000)::numeric, 2), now()
  FROM public.municipios m
  CROSS JOIN LATERAL (
    SELECT s.nombre, s.geom FROM public.estaciones_autobus s
    ORDER BY s.geom <-> m.geom LIMIT 1
  ) e
  WHERE m.geom IS NOT NULL
  ON CONFLICT (municipio_id) DO UPDATE
    SET estacion_autobus_mas_cercana = EXCLUDED.estacion_autobus_mas_cercana,
        distancia_km = EXCLUDED.distancia_km,
        updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

CREATE OR REPLACE FUNCTION public.calcular_calidad_aire()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.calidad_aire_municipio (municipio_id, estacion_mas_cercana, distancia_km, ultimo_valor, contaminante, fecha_dato, updated_at)
  SELECT m.id, e.nombre, round((extensions.ST_Distance(m.geom, e.geom)/1000)::numeric, 2), e.ultimo_valor, e.contaminante, e.fecha_dato, now()
  FROM public.municipios m
  CROSS JOIN LATERAL (
    SELECT s.* FROM public.estaciones_aire s
    WHERE s.ultimo_valor IS NOT NULL
    ORDER BY s.geom <-> m.geom LIMIT 1
  ) e
  WHERE m.geom IS NOT NULL
  ON CONFLICT (municipio_id) DO UPDATE
    SET estacion_mas_cercana = EXCLUDED.estacion_mas_cercana,
        distancia_km = EXCLUDED.distancia_km,
        ultimo_valor = EXCLUDED.ultimo_valor,
        contaminante = EXCLUDED.contaminante,
        fecha_dato = EXCLUDED.fecha_dato,
        updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

-- Weighted 0-100 index. Education/health use log scaling against the regional
-- maximum so that Valladolid does not flatten every small village to zero.
CREATE OR REPLACE FUNCTION public.recalcular_indice_servicios()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE n integer; max_edu numeric; max_sal numeric;
BEGIN
  SELECT greatest(coalesce(max(num_centros),0),1) INTO max_edu FROM public.servicios_educacion;
  SELECT greatest(coalesce(max(num_centros_salud + num_hospitales_consultorios),0),1) INTO max_sal FROM public.servicios_salud;

  INSERT INTO public.indice_servicios (municipio_id, sub_educacion, sub_salud, sub_transporte, sub_aire, indice_calculado, updated_at)
  SELECT m.id,
    e_sub, s_sub, t_sub, a_sub,
    round(100 * (0.30*e_sub + 0.30*s_sub + 0.25*t_sub + 0.15*a_sub), 1),
    now()
  FROM public.municipios m
  CROSS JOIN LATERAL (
    SELECT
      least(1, ln(1 + coalesce((SELECT num_centros FROM public.servicios_educacion WHERE municipio_id = m.id),0)) / ln(1 + max_edu)) AS e_sub,
      least(1, ln(1 + coalesce((SELECT num_centros_salud + num_hospitales_consultorios FROM public.servicios_salud WHERE municipio_id = m.id),0)) / ln(1 + max_sal)) AS s_sub,
      greatest(0, 1 - least(1, coalesce((SELECT distancia_km FROM public.transporte_municipio WHERE municipio_id = m.id), 60) / 60)) AS t_sub,
      greatest(0, 1 - least(1, coalesce((SELECT ultimo_valor FROM public.calidad_aire_municipio WHERE municipio_id = m.id), 25) / 50)) AS a_sub
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

-- Full municipality card
CREATE VIEW public.vista_municipios
WITH (security_invoker = true) AS
SELECT
  m.id, m.cod_ine, m.nombre, m.provincia, m.latitud, m.longitud, m.poblacion,
  coalesce(e.num_centros, 0) AS num_centros_educativos,
  coalesce(s.num_centros_salud, 0) AS num_centros_salud,
  coalesce(s.num_hospitales_consultorios, 0) AS num_hospitales_consultorios,
  t.estacion_autobus_mas_cercana,
  t.distancia_km AS distancia_bus_km,
  a.estacion_mas_cercana AS estacion_aire,
  a.distancia_km AS distancia_aire_km,
  a.ultimo_valor AS aire_ultimo_valor,
  a.contaminante AS aire_contaminante,
  a.fecha_dato AS aire_fecha_dato,
  i.indice_calculado,
  i.sub_educacion, i.sub_salud, i.sub_transporte, i.sub_aire,
  greatest(m.updated_at, coalesce(i.updated_at, m.updated_at)) AS updated_at
FROM public.municipios m
LEFT JOIN public.servicios_educacion e ON e.municipio_id = m.id
LEFT JOIN public.servicios_salud s ON s.municipio_id = m.id
LEFT JOIN public.transporte_municipio t ON t.municipio_id = m.id
LEFT JOIN public.calidad_aire_municipio a ON a.municipio_id = m.id
LEFT JOIN public.indice_servicios i ON i.municipio_id = m.id;

CREATE VIEW public.medias_provincia
WITH (security_invoker = true) AS
SELECT provincia,
  round(avg(indice_calculado)::numeric, 1) AS indice_medio,
  round(avg(num_centros_educativos)::numeric, 2) AS media_educacion,
  round(avg(num_centros_salud + num_hospitales_consultorios)::numeric, 2) AS media_salud,
  round(avg(distancia_bus_km)::numeric, 1) AS media_distancia_bus_km,
  round(avg(aire_ultimo_valor)::numeric, 1) AS media_aire,
  count(*) AS num_municipios
FROM public.vista_municipios GROUP BY provincia;

CREATE VIEW public.medias_comunidad
WITH (security_invoker = true) AS
SELECT
  round(avg(indice_calculado)::numeric, 1) AS indice_medio,
  round(avg(num_centros_educativos)::numeric, 2) AS media_educacion,
  round(avg(num_centros_salud + num_hospitales_consultorios)::numeric, 2) AS media_salud,
  round(avg(distancia_bus_km)::numeric, 1) AS media_distancia_bus_km,
  round(avg(aire_ultimo_valor)::numeric, 1) AS media_aire,
  count(*) AS num_municipios
FROM public.vista_municipios;

-- Grants: fully public open data, read-only for visitors
GRANT SELECT ON public.municipios, public.servicios_educacion, public.servicios_salud,
  public.transporte_municipio, public.calidad_aire_municipio, public.indice_servicios,
  public.estaciones_autobus, public.estaciones_aire, public.sync_log,
  public.vista_municipios, public.medias_provincia, public.medias_comunidad
  TO anon, authenticated;
GRANT ALL ON public.municipios, public.servicios_educacion, public.servicios_salud,
  public.transporte_municipio, public.calidad_aire_municipio, public.indice_servicios,
  public.estaciones_autobus, public.estaciones_aire, public.sync_log TO service_role;
GRANT SELECT ON public.vista_municipios, public.medias_provincia, public.medias_comunidad TO service_role;

ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_educacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios_salud ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporte_municipio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calidad_aire_municipio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indice_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estaciones_autobus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estaciones_aire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica municipios" ON public.municipios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica educacion" ON public.servicios_educacion FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica salud" ON public.servicios_salud FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica transporte" ON public.transporte_municipio FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica aire" ON public.calidad_aire_municipio FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica indice" ON public.indice_servicios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica estaciones bus" ON public.estaciones_autobus FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica estaciones aire" ON public.estaciones_aire FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Lectura publica sync log" ON public.sync_log FOR SELECT TO anon, authenticated USING (true);