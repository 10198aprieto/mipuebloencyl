import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchUltimaActualizacion, fmtFecha } from "@/lib/cyl";

export function PieSitio() {
  const actualizado = useQuery({
    queryKey: ["ultima-actualizacion"],
    queryFn: fetchUltimaActualizacion,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl space-y-4 px-5 py-8 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Fuente:</strong> Portal de Datos Abiertos de la Junta de Castilla y
          León (municipios, centros docentes, centros y establecimientos sanitarios, farmacias, estaciones de
          autobuses y de calidad del aire, bibliotecas y museos, comercio, servicios sociales y movilidad).
        </p>
        <p>
          Última actualización de los datos: {fmtFecha(actualizado.data)}. Los datos se sincronizan
          automáticamente una vez al mes.
        </p>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/metodologia" className="font-medium text-primary underline underline-offset-4">
            Metodología
          </Link>
          <Link to="/aviso-legal" className="font-medium text-primary underline underline-offset-4">
            Aviso legal
          </Link>
          <Link to="/politica-privacidad" className="font-medium text-primary underline underline-offset-4">
            Política de privacidad
          </Link>
          <Link to="/politica-cookies" className="font-medium text-primary underline underline-offset-4">
            Política de cookies
          </Link>
          <a
            className="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4"
            href="https://datosabiertos.jcyl.es/"
            target="_blank"
            rel="noreferrer"
          >
            datosabiertos.jcyl.es <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </nav>
        <p className="text-xs">© 2026 Mateo Fernández Prieto · MiPuebloEnCyL</p>
      </div>
    </footer>
  );
}