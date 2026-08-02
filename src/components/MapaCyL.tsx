import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PuntoMapa } from "@/lib/cyl";
import { nivelIndice } from "@/lib/cyl";

type Props = {
  puntos: PuntoMapa[];
  seleccionado: PuntoMapa | null;
  onSelect: (m: PuntoMapa) => void;
};

/**
 * ~2.200 municipios: se dibujan como círculos vectoriales sobre un renderer
 * de canvas (una sola capa de dibujo) en lugar de marcadores DOM, para que el
 * mapa cargue y se desplace con fluidez.
 */
export default function MapaCyL({ puntos, seleccionado, onSelect }: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const porId = useRef(new Map<string, L.CircleMarker>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const datos = useMemo(() => puntos, [puntos]);

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    const m = L.map(contenedor.current, {
      center: [41.75, -4.75],
      zoom: 7,
      preferCanvas: true,
      scrollWheelZoom: false,
ековая: undefined,
    } as L.MapOptions);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18,
    }).addTo(m);
    capa.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      capa.current = null;
      porId.current.clear();
    };
  }, []);

  useEffect(() => {
    const grupo = capa.current;
    if (!grupo) return;
    grupo.clearLayers();
    porId.current.clear();
    const renderer = L.canvas({ padding: 0.3 });
    for (const p of datos) {
      const nivel = nivelIndice(p.indice_calculado);
      const marcador = L.circleMarker([p.latitud, p.longitud], {
        renderer,
        radius: 4.5,
        weight: 1,
        color: "#ffffff",
        opacity: 0.85,
        fillColor: nivel.color,
        fillOpacity: 0.9,
      });
      marcador.bindTooltip(
        `<strong>${p.nombre}</strong><br/>Índice: ${p.indice_calculado ?? "s/d"} · ${nivel.etiqueta}`,
      );
      marcador.on("click", () => onSelectRef.current(p));
      marcador.addTo(grupo);
      porId.current.set(p.id, marcador);
    }
  }, [datos]);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !seleccionado) return;
    m.flyTo([seleccionado.latitud, seleccionado.longitud], 11, { duration: 0.8 });
    for (const [id, marcador] of porId.current) {
      const activo = id === seleccionado.id;
      marcador.setStyle({ radius: activo ? 10 : 4.5, weight: activo ? 3 : 1, color: activo ? "#1f2937" : "#ffffff" });
      if (activo) marcador.bringToFront();
    }
  }, [seleccionado]);

  return <div ref={contenedor} className="h-full w-full" role="application" aria-label="Mapa de municipios de Castilla y León" />;
}