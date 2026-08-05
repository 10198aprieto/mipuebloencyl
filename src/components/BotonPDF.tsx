import { useState } from "react";
import { FileDown } from "lucide-react";
import { fmtFecha, fmtNum, nivelIndice, type MunicipioFicha } from "@/lib/cyl";

const FUENTES: Array<[string, string]> = [
  ["Registro de municipios", "https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-municipios-de-castilla-y-leon/"],
  ["Directorio de centros docentes", "https://analisis.datosabiertos.jcyl.es/explore/dataset/directorio-de-centros-docentes/"],
  ["Centros de salud por municipio", "https://analisis.datosabiertos.jcyl.es/explore/dataset/centros-de-salud-municipios/"],
  ["Establecimientos farmaceuticos", "https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-establecimientos-farmaceuticos-de-castilla-y-leon/"],
  ["Estaciones de autobuses", "https://analisis.datosabiertos.jcyl.es/explore/dataset/estaciones-de-autobuses/"],
  ["Calidad del aire", "https://analisis.datosabiertos.jcyl.es/explore/dataset/estaciones-de-control-de-la-calidad-del-aire/"],
  ["Bibliotecas y museos", "https://analisis.datosabiertos.jcyl.es/explore/dataset/museos/"],
  ["Centros y servicios de caracter social", "https://analisis.datosabiertos.jcyl.es/explore/dataset/centros-de-caracter-social/"],
];

export function BotonPDF({
  municipio,
  indice,
  actualizado,
}: {
  municipio: MunicipioFicha;
  indice: number | null;
  actualizado: string | null;
}) {
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const M = 48;
      const ancho = doc.internal.pageSize.getWidth();
      let y = M;
      const nivel = nivelIndice(indice);

      const linea = (
        texto: string,
        opts: { size?: number; bold?: boolean; gris?: boolean; salto?: number } = {},
      ) => {
        doc.setFontSize(opts.size ?? 10);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setTextColor(opts.gris ? 110 : 30);
        const partes = doc.splitTextToSize(texto, ancho - M * 2) as string[];
        for (const p of partes) {
          if (y > doc.internal.pageSize.getHeight() - M) {
            doc.addPage();
            y = M;
          }
          doc.text(p, M, y);
          y += (opts.size ?? 10) * 1.35;
        }
        y += opts.salto ?? 0;
      };

      linea("MiPuebloEnCyL", { size: 11, bold: true, gris: true, salto: 12 });
      linea(municipio.nombre, { size: 26, bold: true });
      linea(
        `Provincia de ${municipio.provincia} · ${fmtNum(municipio.poblacion)} habitantes · INE ${municipio.cod_ine}`,
        { gris: true, salto: 10 },
      );

      doc.setDrawColor(210);
      doc.line(M, y, ancho - M, y);
      y += 20;

      linea(`Índice de servicios: ${indice ?? "s/d"}/100 — cobertura ${nivel.etiqueta.toLowerCase()}`, {
        size: 14,
        bold: true,
        salto: 8,
      });

      linea("Subíndices (0-100)", { size: 12, bold: true, salto: 2 });
      const subs: Array<[string, number | null]> = [
        ["Educación", municipio.sub_educacion],
        ["Salud", municipio.sub_salud],
        ["Movilidad", municipio.sub_movilidad],
        ["Social", municipio.sub_social],
        ["Cultura y ocio", municipio.sub_cultura],
        ["Comercio", municipio.sub_comercio],
      ];
      for (const [k, v] of subs) linea(`• ${k}: ${v === null ? "s/d" : fmtNum(v, "", 1)}`);
      y += 12;

      linea("Indicadores", { size: 12, bold: true, salto: 2 });
      const inds: Array<[string, string]> = [
        ["Centros educativos", fmtNum(municipio.num_centros_educativos)],
        ["Colegios profesionales", fmtNum(municipio.num_colegios_profesionales)],
        [
          "Centros y consultorios sanitarios",
          fmtNum(municipio.num_centros_salud + municipio.num_hospitales_consultorios),
        ],
        ["Farmacias", fmtNum(municipio.num_farmacias)],
        ["Área de salud", municipio.area_salud ?? "Sin dato"],
        ["Centro de salud de referencia", municipio.centro_salud_referencia ?? "Sin dato"],
        [
          "Calidad del aire",
          municipio.aire_ultimo_valor !== null
            ? `${fmtNum(municipio.aire_ultimo_valor, "", 1)} (${municipio.aire_contaminante ?? "s/d"}, estación ${municipio.estacion_aire ?? "—"}, ${fmtFecha(municipio.aire_fecha_dato)})`
            : "Sin dato",
        ],
        [
          "Distancia a estación de autobuses",
          municipio.distancia_bus_km !== null
            ? `${fmtNum(municipio.distancia_bus_km, " km", 1)} (${municipio.estacion_autobus_mas_cercana ?? "s/d"})`
            : "Sin dato",
        ],
        ["Estaciones de ITV", fmtNum(municipio.num_centros_itv)],
        ["Puntos de recarga eléctrica", fmtNum(municipio.num_puntos_recarga_electrica)],
        ["Centros de carácter social", fmtNum(municipio.num_centros_caracter_social)],
        ["Servicios de carácter social", fmtNum(municipio.num_servicios_caracter_social)],
        ["Puntos de donación", fmtNum(municipio.num_puntos_donacion)],
        ["Bibliotecas y bibliobuses", fmtNum(municipio.num_bibliotecas_bibliobuses)],
        ["Museos", fmtNum(municipio.num_museos)],
        ["Fiestas declaradas", municipio.tiene_fiestas_registradas ? "Sí" : "No consta"],
        ["Establecimientos comerciales", fmtNum(municipio.num_establecimientos_comerciales)],
        ["Comercio de proximidad", fmtNum(municipio.num_servicios_proximidad)],
      ];
      for (const [k, v] of inds) linea(`• ${k}: ${v}`);
      y += 12;

      linea(`Última actualización de los datos: ${fmtFecha(actualizado)}`, { gris: true, salto: 12 });

      linea("Fuentes (Portal de Datos Abiertos de la Junta de Castilla y León)", {
        size: 12,
        bold: true,
        salto: 2,
      });
      for (const [nombre, url] of FUENTES) {
        if (y > doc.internal.pageSize.getHeight() - M - 24) {
          doc.addPage();
          y = M;
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30);
        doc.text(`• ${nombre}`, M, y);
        y += 11;
        doc.setFontSize(7.5);
        doc.setTextColor(20, 80, 160);
        doc.textWithLink(url, M + 10, y, { url });
        y += 14;
      }
      y += 10;
      linea("Generado con MiPuebloEnCyL · https://mipuebloencyl.lovable.app", { size: 9, gris: true });

      doc.save(`mipuebloencyl-${municipio.nombre.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.pdf`);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={generar}
      disabled={generando}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70 disabled:opacity-60"
    >
      <FileDown className="size-4" aria-hidden />
      {generando ? "Generando PDF…" : "Descargar ficha en PDF"}
    </button>
  );
}