DROP VIEW IF EXISTS public.medias_provincia;
DROP VIEW IF EXISTS public.medias_comunidad;
DROP VIEW IF EXISTS public.vista_municipios;

CREATE VIEW public.vista_municipios AS
SELECT m.id, m.cod_ine, m.nombre, m.provincia, m.latitud, m.longitud, m.poblacion,
  COALESCE(e.num_centros, 0) AS num_centros_educativos,
  COALESCE(s.num_centros_salud, 0) AS num_centros_salud,
  COALESCE(s.num_hospitales_consultorios, 0) AS num_hospitales_consultorios,
  COALESCE(s.num_farmacias, 0) AS num_farmacias,
  s.area_salud, s.centro_salud_referencia,
  t.estacion_autobus_mas_cercana, t.distancia_km AS distancia_bus_km,
  a.estacion_mas_cercana AS estacion_aire, a.distancia_km AS distancia_aire_km,
  a.ultimo_valor AS aire_ultimo_valor, a.contaminante AS aire_contaminante, a.fecha_dato AS aire_fecha_dato,
  COALESCE(cu.num_bibliotecas_bibliobuses, 0) AS num_bibliotecas_bibliobuses,
  COALESCE(cu.num_museos, 0) AS num_museos,
  COALESCE(cu.tiene_fiestas_registradas, false) AS tiene_fiestas_registradas,
  cu.proxima_fiesta, cu.nombre_proxima_fiesta,
  COALESCE(co.num_establecimientos_comerciales, 0) AS num_establecimientos_comerciales,
  COALESCE(co.num_servicios_proximidad, 0) AS num_servicios_proximidad,
  COALESCE(cp.num_colegios_profesionales, 0) AS num_colegios_profesionales,
  COALESCE(so.num_centros_caracter_social, 0) AS num_centros_caracter_social,
  COALESCE(so.num_servicios_caracter_social, 0) AS num_servicios_caracter_social,
  COALESCE(so.num_puntos_donacion, 0) AS num_puntos_donacion,
  COALESCE(mv.num_centros_itv, 0) AS num_centros_itv,
  COALESCE(mv.num_puntos_recarga_electrica, 0) AS num_puntos_recarga_electrica,
  i.indice_calculado, i.sub_educacion, i.sub_salud, i.sub_transporte, i.sub_aire,
  i.sub_movilidad, i.sub_social, i.sub_cultura, i.sub_comercio,
  GREATEST(m.updated_at, COALESCE(i.updated_at, m.updated_at)) AS updated_at
FROM municipios m
LEFT JOIN servicios_educacion e ON e.municipio_id = m.id
LEFT JOIN servicios_salud s ON s.municipio_id = m.id
LEFT JOIN transporte_municipio t ON t.municipio_id = m.id
LEFT JOIN calidad_aire_municipio a ON a.municipio_id = m.id
LEFT JOIN servicios_cultura_ocio cu ON cu.municipio_id = m.id
LEFT JOIN servicios_comercio co ON co.municipio_id = m.id
LEFT JOIN colegios_profesionales_municipio cp ON cp.municipio_id = m.id
LEFT JOIN servicios_sociales so ON so.municipio_id = m.id
LEFT JOIN servicios_movilidad_vehiculos mv ON mv.municipio_id = m.id
LEFT JOIN indice_servicios i ON i.municipio_id = m.id;
GRANT SELECT ON public.vista_municipios TO anon, authenticated;

CREATE VIEW public.medias_provincia AS
SELECT provincia,
  round(avg(indice_calculado), 1) AS indice_medio,
  round(avg(num_centros_educativos), 2) AS media_educacion,
  round(avg(num_centros_salud + num_hospitales_consultorios), 2) AS media_salud,
  round(avg(num_farmacias), 2) AS media_farmacias,
  round(avg(distancia_bus_km), 1) AS media_distancia_bus_km,
  round(avg(aire_ultimo_valor), 1) AS media_aire,
  round(avg(num_bibliotecas_bibliobuses + num_museos), 2) AS media_cultura,
  round(avg(num_establecimientos_comerciales), 2) AS media_comercio,
  round(avg(num_centros_caracter_social + num_servicios_caracter_social), 2) AS media_social,
  round(avg(num_centros_itv + num_puntos_recarga_electrica), 2) AS media_movilidad,
  round(avg(sub_educacion), 1) AS media_sub_educacion,
  round(avg(sub_salud), 1) AS media_sub_salud,
  round(avg(sub_movilidad), 1) AS media_sub_movilidad,
  round(avg(sub_social), 1) AS media_sub_social,
  round(avg(sub_cultura), 1) AS media_sub_cultura,
  round(avg(sub_comercio), 1) AS media_sub_comercio,
  round(avg(sub_aire), 1) AS media_sub_aire,
  count(*) AS num_municipios
FROM vista_municipios GROUP BY provincia;
GRANT SELECT ON public.medias_provincia TO anon, authenticated;

CREATE VIEW public.medias_comunidad AS
SELECT round(avg(indice_calculado), 1) AS indice_medio,
  round(avg(num_centros_educativos), 2) AS media_educacion,
  round(avg(num_centros_salud + num_hospitales_consultorios), 2) AS media_salud,
  round(avg(num_farmacias), 2) AS media_farmacias,
  round(avg(distancia_bus_km), 1) AS media_distancia_bus_km,
  round(avg(aire_ultimo_valor), 1) AS media_aire,
  round(avg(num_bibliotecas_bibliobuses + num_museos), 2) AS media_cultura,
  round(avg(num_establecimientos_comerciales), 2) AS media_comercio,
  round(avg(num_centros_caracter_social + num_servicios_caracter_social), 2) AS media_social,
  round(avg(num_centros_itv + num_puntos_recarga_electrica), 2) AS media_movilidad,
  round(avg(sub_educacion), 1) AS media_sub_educacion,
  round(avg(sub_salud), 1) AS media_sub_salud,
  round(avg(sub_movilidad), 1) AS media_sub_movilidad,
  round(avg(sub_social), 1) AS media_sub_social,
  round(avg(sub_cultura), 1) AS media_sub_cultura,
  round(avg(sub_comercio), 1) AS media_sub_comercio,
  round(avg(sub_aire), 1) AS media_sub_aire,
  count(*) AS num_municipios
FROM vista_municipios;
GRANT SELECT ON public.medias_comunidad TO anon, authenticated;