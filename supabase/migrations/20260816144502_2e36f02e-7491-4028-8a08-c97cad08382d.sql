
CREATE TABLE IF NOT EXISTS public.visitas_municipio (
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  contador integer NOT NULL DEFAULT 0,
  PRIMARY KEY (municipio_id, fecha)
);
GRANT SELECT ON public.visitas_municipio TO anon, authenticated;
GRANT ALL ON public.visitas_municipio TO service_role;
ALTER TABLE public.visitas_municipio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica visitas" ON public.visitas_municipio FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.registrar_visita(_municipio_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE total integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.municipios WHERE id = _municipio_id) THEN
    RETURN 0;
  END IF;
  INSERT INTO public.visitas_municipio (municipio_id, fecha, contador)
  VALUES (_municipio_id, current_date, 1)
  ON CONFLICT (municipio_id, fecha) DO UPDATE SET contador = public.visitas_municipio.contador + 1;
  SELECT coalesce(sum(contador),0) INTO total FROM public.visitas_municipio WHERE municipio_id = _municipio_id;
  RETURN total;
END; $$;
GRANT EXECUTE ON FUNCTION public.registrar_visita(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.visitas_resumen()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', coalesce((SELECT sum(contador) FROM public.visitas_municipio), 0),
    'semana', coalesce((SELECT sum(contador) FROM public.visitas_municipio WHERE fecha >= current_date - 6), 0),
    'municipios_semana', (SELECT count(DISTINCT municipio_id) FROM public.visitas_municipio WHERE fecha >= current_date - 6)
  );
$$;
GRANT EXECUTE ON FUNCTION public.visitas_resumen() TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.datos_curiosos (
  clave text PRIMARY KEY,
  orden integer NOT NULL DEFAULT 0,
  icono text NOT NULL DEFAULT 'sparkles',
  titulo text NOT NULL,
  texto text NOT NULL,
  municipio_id uuid REFERENCES public.municipios(id) ON DELETE SET NULL,
  cod_ine integer,
  municipio_nombre text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.datos_curiosos TO anon, authenticated;
GRANT ALL ON public.datos_curiosos TO service_role;
ALTER TABLE public.datos_curiosos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica curiosos" ON public.datos_curiosos FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.recalcular_datos_curiosos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer := 0; r record;
BEGIN
  DELETE FROM public.datos_curiosos;

  SELECT * INTO r FROM public.vista_municipios
   WHERE distancia_bus_km IS NOT NULL ORDER BY distancia_bus_km DESC LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.datos_curiosos (clave, orden, icono, titulo, texto, municipio_id, cod_ine, municipio_nombre)
    VALUES ('bus_lejos', 1, 'bus', 'El más lejos del autobús',
      r.nombre || ' (' || r.provincia || ') está a ' || round(r.distancia_bus_km, 1) || ' km en línea recta de la estación de autobuses más cercana.',
      r.id, r.cod_ine, r.nombre);
    n := n + 1;
  END IF;

  SELECT *, (num_museos + num_bibliotecas_bibliobuses)::numeric * 1000 / greatest(poblacion,1) AS ratio
    INTO r FROM public.vista_municipios
   WHERE poblacion >= 200 AND (num_museos + num_bibliotecas_bibliobuses) > 0
   ORDER BY ratio DESC LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.datos_curiosos (clave, orden, icono, titulo, texto, municipio_id, cod_ine, municipio_nombre)
    VALUES ('cultura_ratio', 2, 'library', 'Récord de cultura por habitante',
      r.nombre || ' (' || r.provincia || ') reúne ' || (r.num_museos + r.num_bibliotecas_bibliobuses) || ' museos y bibliotecas para ' || r.poblacion || ' habitantes: ' || round((r.num_museos + r.num_bibliotecas_bibliobuses)::numeric * 1000 / greatest(r.poblacion,1), 1) || ' por cada mil vecinos.',
      r.id, r.cod_ine, r.nombre);
    n := n + 1;
  END IF;

  SELECT * INTO r FROM public.vista_municipios
   WHERE poblacion IS NOT NULL AND poblacion < 500 AND indice_calculado IS NOT NULL
   ORDER BY indice_calculado DESC LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.datos_curiosos (clave, orden, icono, titulo, texto, municipio_id, cod_ine, municipio_nombre)
    VALUES ('pequeno_campeon', 3, 'trophy', 'Pequeño pero bien servido',
      'Con solo ' || r.poblacion || ' habitantes, ' || r.nombre || ' (' || r.provincia || ') alcanza un índice de ' || round(r.indice_calculado,1) || '/100, el mejor entre los municipios de menos de 500 vecinos.',
      r.id, r.cod_ine, r.nombre);
    n := n + 1;
  END IF;

  SELECT v.*, v.indice_calculado - p.media AS dif INTO r
    FROM public.vista_municipios v
    JOIN (SELECT provincia, avg(indice_calculado) AS media FROM public.vista_municipios GROUP BY provincia) p
      ON p.provincia = v.provincia
   WHERE v.indice_calculado IS NOT NULL
   ORDER BY dif DESC LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.datos_curiosos (clave, orden, icono, titulo, texto, municipio_id, cod_ine, municipio_nombre)
    VALUES ('destaca_provincia', 4, 'trending-up', 'El que más destaca en su provincia',
      r.nombre || ' supera en ' || round(r.dif,1) || ' puntos la media de la provincia de ' || r.provincia || '.',
      r.id, r.cod_ine, r.nombre);
    n := n + 1;
  END IF;

  SELECT v.*, p.media - v.indice_calculado AS dif INTO r
    FROM public.vista_municipios v
    JOIN (SELECT provincia, avg(indice_calculado) AS media FROM public.vista_municipios GROUP BY provincia) p
      ON p.provincia = v.provincia
   WHERE v.indice_calculado IS NOT NULL
   ORDER BY dif DESC LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.datos_curiosos (clave, orden, icono, titulo, texto, municipio_id, cod_ine, municipio_nombre)
    VALUES ('rezagado_provincia', 5, 'trending-down', 'El que más se queda atrás',
      r.nombre || ' se sitúa ' || round(r.dif,1) || ' puntos por debajo de la media de la provincia de ' || r.provincia || '.',
      r.id, r.cod_ine, r.nombre);
    n := n + 1;
  END IF;

  INSERT INTO public.datos_curiosos (clave, orden, icono, titulo, texto)
  SELECT 'brecha_provincia', 6, 'split',
    'La provincia más desigual',
    'En ' || provincia || ' hay ' || round(max(indice_calculado) - min(indice_calculado),1) || ' puntos de diferencia entre su municipio mejor y peor atendido.'
  FROM public.vista_municipios
  WHERE indice_calculado IS NOT NULL
  GROUP BY provincia
  ORDER BY max(indice_calculado) - min(indice_calculado) DESC
  LIMIT 1;
  n := n + 1;

  RETURN n;
END; $$;

SELECT public.recalcular_datos_curiosos();
