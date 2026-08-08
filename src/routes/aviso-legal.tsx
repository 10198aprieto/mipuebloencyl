import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/aviso-legal")({
  head: () => ({
    meta: [
      { title: "Aviso legal | MiPuebloEnCyL" },
      {
        name: "description",
        content:
          "Titularidad, finalidad, condiciones de uso y limitación de responsabilidad del proyecto MiPuebloEnCyL, comparador de servicios públicos de Castilla y León.",
      },
      { property: "og:title", content: "Aviso legal | MiPuebloEnCyL" },
      { property: "og:description", content: "Titularidad y condiciones de uso de MiPuebloEnCyL." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mipuebloencyl.lovable.app/aviso-legal" },
      { property: "og:site_name", content: "MiPuebloEnCyL" },
      { property: "og:locale", content: "es_ES" },
      { property: "og:image", content: "https://mipuebloencyl.lovable.app/og-mipuebloencyl.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Aviso legal | MiPuebloEnCyL" },
      { name: "twitter:description", content: "Titularidad y condiciones de uso de MiPuebloEnCyL." },
      { name: "twitter:image", content: "https://mipuebloencyl.lovable.app/og-mipuebloencyl.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://mipuebloencyl.lovable.app/aviso-legal" }],
  }),
  component: AvisoLegal,
});

function AvisoLegal() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="text-sm text-primary underline underline-offset-4">
        ← Volver al comparador
      </Link>
      <h1 className="mt-4 text-4xl">Aviso legal</h1>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-xl text-foreground">1. Titularidad del sitio</h2>
        <p>
          Este sitio web (MiPuebloEnCyL) es titularidad de <strong className="text-foreground">Mateo Fernández
          Prieto</strong>, con domicilio en Arroyo de la Encomienda (Valladolid), España. Puedes contactar a través
          del formulario de sugerencias disponible en la ficha de cada municipio.
        </p>

        <h2 className="pt-4 text-xl text-foreground">2. Finalidad</h2>
        <p>
          MiPuebloEnCyL es un proyecto personal de reutilización de datos abiertos, sin ánimo comercial, presentado
          al Concurso de Datos Abiertos de Castilla y León. Su finalidad es divulgativa: facilitar la consulta y
          comparación del acceso a servicios públicos en los municipios de Castilla y León.
        </p>

        <h2 className="pt-4 text-xl text-foreground">3. Condiciones de uso</h2>
        <p>
          El acceso al sitio es libre y gratuito. La persona usuaria se compromete a hacer un uso adecuado de los
          contenidos y a no emplearlos para actividades ilícitas, ni para dañar el funcionamiento del sitio. Los
          contenidos elaborados (índices, textos y visualizaciones) pueden reutilizarse citando la fuente y
          enlazando a este sitio. Los datos de origen están sujetos a las condiciones de reutilización del Portal
          de Datos Abiertos de la Junta de Castilla y León.
        </p>

        <h2 className="pt-4 text-xl text-foreground">4. Limitación de responsabilidad</h2>
        <p>
          Los datos mostrados proceden de fuentes públicas de la Junta de Castilla y León y se sincronizan de forma
          automática una vez al mes. Pueden contener errores de origen, estar incompletos o no reflejar la
          situación actual de un municipio. El titular no garantiza la exactitud, vigencia ni exhaustividad de la
          información y no se responsabiliza de las decisiones tomadas a partir de ella. Los índices son una
          elaboración propia con fines divulgativos y no constituyen una valoración oficial de ningún municipio.
        </p>

        <h2 className="pt-4 text-xl text-foreground">5. Enlaces externos</h2>
        <p>
          El sitio contiene enlaces a páginas de terceros (entre otras, datosabiertos.jcyl.es). El titular no
          responde de sus contenidos ni de su disponibilidad.
        </p>

        <h2 className="pt-4 text-xl text-foreground">6. Legislación aplicable</h2>
        <p>Este aviso legal se rige por la legislación española.</p>
      </section>
    </div>
  );
}