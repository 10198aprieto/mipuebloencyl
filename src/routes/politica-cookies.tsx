import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-cookies")({
  head: () => ({
    meta: [
      { title: "Política de cookies | MiPuebloEnCyL" },
      {
        name: "description",
        content:
          "Qué cookies utiliza MiPuebloEnCyL, para qué sirven, cuánto duran y cómo aceptar, rechazar o revocar tu consentimiento.",
      },
      { property: "og:title", content: "Política de cookies | MiPuebloEnCyL" },
      { property: "og:description", content: "Cookies utilizadas en MiPuebloEnCyL y cómo gestionarlas." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mipuebloencyl.lovable.app/politica-cookies" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://mipuebloencyl.lovable.app/politica-cookies" }],
  }),
  component: Cookies,
});

const COOKIES = [
  { nombre: "_ga", titular: "Google (tercero)", finalidad: "Distinguir usuarios únicos para medir la audiencia", duracion: "2 años" },
  { nombre: "_ga_G-S9XJ86DPCW", titular: "Google (tercero)", finalidad: "Mantener el estado de la sesión de Google Analytics 4", duracion: "2 años" },
  { nombre: "_gid", titular: "Google (tercero)", finalidad: "Distinguir usuarios durante 24 horas", duracion: "24 horas" },
  { nombre: "_gat", titular: "Google (tercero)", finalidad: "Limitar el número de peticiones a Analytics", duracion: "1 minuto" },
  {
    nombre: "mipuebloencyl:consentimiento-cookies",
    titular: "MiPuebloEnCyL (propia, almacenamiento local)",
    finalidad: "Recordar si has aceptado o rechazado las cookies analíticas",
    duracion: "Hasta que borres los datos del navegador",
  },
];

function Cookies() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="text-sm text-primary underline underline-offset-4">
        ← Volver al comparador
      </Link>
      <h1 className="mt-4 text-4xl">Política de cookies</h1>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          Una cookie es un pequeño archivo que se descarga en tu dispositivo al visitar una web. MiPuebloEnCyL no
          instala ninguna cookie analítica hasta que das tu consentimiento en el banner de la primera visita. Si lo
          rechazas, la web funciona con normalidad y no se carga Google Analytics.
        </p>

        <h2 className="pt-4 text-xl text-foreground">Cookies utilizadas</h2>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-left text-sm">
            <caption className="sr-only">Listado de cookies utilizadas por MiPuebloEnCyL</caption>
            <thead>
              <tr className="border-b border-border text-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Nombre</th>
                <th scope="col" className="py-2 pr-3 font-medium">Titular</th>
                <th scope="col" className="py-2 pr-3 font-medium">Finalidad</th>
                <th scope="col" className="py-2 font-medium">Duración</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.nombre} className="border-b border-border align-top">
                  <td className="py-2 pr-3 font-mono text-xs text-foreground">{c.nombre}</td>
                  <td className="py-2 pr-3">{c.titular}</td>
                  <td className="py-2 pr-3">{c.finalidad}</td>
                  <td className="py-2">{c.duracion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="pt-4 text-xl text-foreground">Cómo revocar tu consentimiento</h2>
        <p>
          Puedes cambiar tu decisión en cualquier momento borrando los datos del sitio en tu navegador: al volver a
          entrar aparecerá de nuevo el banner. También puedes bloquear o eliminar las cookies desde la
          configuración de tu navegador o instalar el complemento de inhabilitación de Google Analytics.
        </p>
        <p>
          Más información sobre el tratamiento de datos en la{" "}
          <Link to="/politica-privacidad" className="text-primary underline underline-offset-4">
            política de privacidad
          </Link>
          .
        </p>
      </section>
    </div>
  );
}