import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoMunicipios, PuntoMapa } from "@/lib/cyl";
import { nivelIndice } from "@/lib/cyl";

type Props = {
  geo: GeoMunicipios | null;
  puntos: PuntoMapa[];
  /** Índice (0-100) ya recalculado con los pesos elegidos, por id de municipio. */
  indices: Map<string, number | null>;
  seleccionado: PuntoMapa | null;
  onSelect: (m: PuntoMapa) => void;
};

/**
 * Mapa coroplético con las geometrías municipales reales (límites oficiales de
 * la Junta, simplificados en la base de datos). Se dibuja sobre un renderer de
 * canvas para que los 2.248 polígonos se muevan con fluidez.
 */
export default function MapaCyL({ geo, puntos, indices, seleccionado, onSelect }: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.GeoJSON | null>(null);
  const porId = useRef(new Map<string, L.Path>());
  const onSelectRef = useRef(onSelect);
  const puntosRef = useRef(new Map<string, PuntoMapa>());
  const indicesRef = useRef(indices);
  onSelectRef.current = onSelect;
  indicesRef.current = indices;
  puntosRef.current = new Map(puntos.map((p) => [p.id, p]));

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    const m = L.map(contenedor.current, {
      center: [41.75, -4.75],
      zoom: 7,
      preferCanvas: true,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18,
    }).addTo(m);
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      capa.current = null;
      porId.current.clear();
    };
  }, []);

  // Dibuja los polígonos una sola vez por carga de geometrías.
  useEffect(() => {
    const m = mapa.current;
    if (!m || !geo) return;
    capa.current?.remove();
    porId.current.clear();
    const renderer = L.canvas({ padding: 0.3 });
    const capaGeo = L.geoJSON(geo as unknown as GeoJSON.FeatureCollection, {
      renderer,
      style: () => ({ weight: 0.4, color: "#ffffff", opacity: 0.7, fillOpacity: 0.85 }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties as { id: string; nombre: string };
        porId.current.set(props.id, layer as L.Path);
        layer.on("click", () => {
          const punto = puntosRef.current.get(props.id);
          if (punto) onSelectRef.current(punto);
        });
      },
    }).addTo(m);
    capa.current = capaGeo;
    return () => {
      capaGeo.remove();
    };
  }, [geo]);

  // Recolorea y actualiza tooltips cuando cambian los índices (pesos personalizados).
  useEffect(() => {
    for (const [id, layer] of porId.current) {
      const indice = indices.get(id) ?? null;
      const nivel = nivelIndice(indice);
      const activo = seleccionado?.id === id;
      layer.setStyle({
        fillColor: nivel.color,
        color: activo ? "#1f2937" : "#ffffff",
        weight: activo ? 2.5 : 0.4,
        fillOpacity: 0.85,
      });
      if (activo) layer.bringToFront();
      const nombre = puntosRef.current.get(id)?.nombre ?? "";
      layer.unbindTooltip();
      layer.bindTooltip(
        `<strong>${nombre}</strong><br/>Índice: ${indice ?? "s/d"} · ${nivel.etiqueta}`,
        { sticky: true },
      );
    }
  }, [indices, seleccionado, geo]);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !seleccionado) return;
    m.flyTo([seleccionado.latitud, seleccionado.longitud], 10, { duration: 0.8 });
  }, [seleccionado]);

  return (
    <div
      ref={contenedor}
      className="h-full w-full"
      role="application"
      aria-label="Mapa coroplético de municipios de Castilla y León"
    />
  );
}