import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad | MiPuebloEnCyL" },
      {
        name: "description",
        content:
          "Qué datos personales trata MiPuebloEnCyL, con qué finalidad y base legal, y cómo ejercer tus derechos de acceso, rectificación y supresión.",
      },
      { property: "og:title", content: "Política de privacidad | MiPuebloEnCyL" },
      { property: "og:description", content: "Tratamiento de datos personales en MiPuebloEnCyL." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mipuebloencyl.lovable.app/politica-privacidad" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://mipuebloencyl.lovable.app/politica-privacidad" }],
  }),
  component: Privacidad,
});

function Privacidad() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/" className="text-sm text-primary underline underline-offset-4">
        ← Volver al comparador
      </Link>
      <h1 className="mt-4 text-4xl">Política de privacidad</h1>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-xl text-foreground">Responsable del tratamiento</h2>
        <p>
          Mateo Fernández Prieto, Arroyo de la Encomienda (Valladolid), España. Contacto para asuntos de
          privacidad: a través del formulario de sugerencias de la web, indicando un email de contacto.
        </p>

        <h2 className="pt-4 text-xl text-foreground">Qué datos se recogen</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Buscador de municipios y selector de pesos:</strong> no recogen ni
            almacenan ningún dato personal. Las búsquedas se resuelven en tu navegador y no se guardan.
          </li>
          <li>
            <strong className="text-foreground">Formulario de sugerencias:</strong> se almacena el mensaje que
            escribes, el municipio al que se refiere y, si decides facilitarlo, un email de contacto. El email es
            opcional y solo se usa para responderte sobre esa sugerencia.
          </li>
          <li>
            <strong className="text-foreground">Google Analytics (solo si aceptas las cookies):</strong> datos de
            navegación como páginas vistas, tipo de dispositivo, navegador, idioma y ubicación aproximada derivada
            de la IP. Si rechazas las cookies, este script no se carga y no se recoge nada.
          </li>
        </ul>

        <h2 className="pt-4 text-xl text-foreground">Finalidad y base legal</h2>
        <p>
          Las sugerencias se tratan para revisar y corregir la información publicada; la base legal es tu
          consentimiento al enviar el formulario. Los datos de navegación se tratan para medir la audiencia y
          mejorar el sitio; la base legal es tu consentimiento expreso mediante el banner de cookies, revocable en
          cualquier momento.
        </p>

        <h2 className="pt-4 text-xl text-foreground">Destinatarios y cesiones</h2>
        <p>
          Los datos del formulario se almacenan en la infraestructura de alojamiento y base de datos del proyecto,
          que actúa como encargada del tratamiento. Los datos de navegación se ceden a Google Ireland Ltd. como
          proveedor de Google Analytics, que puede realizar transferencias internacionales amparadas en sus
          cláusulas contractuales tipo. No se venden ni ceden datos a otros terceros.
        </p>

        <h2 className="pt-4 text-xl text-foreground">Conservación</h2>
        <p>
          Las sugerencias se conservan mientras sean útiles para mantener la calidad de los datos. Las cookies
          analíticas caducan en los plazos indicados en la{" "}
          <Link to="/politica-cookies" className="text-primary underline underline-offset-4">
            política de cookies
          </Link>
          .
        </p>

        <h2 className="pt-4 text-xl text-foreground">Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad
          escribiendo a través del formulario de sugerencias (tipo «Otro»), indicando tu petición y un email de
          contacto. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos
          (www.aepd.es).
        </p>
      </section>
    </div>
  );
}