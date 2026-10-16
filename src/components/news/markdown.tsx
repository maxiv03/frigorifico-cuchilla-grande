import { Fragment } from "react";

/**
 * Markdown mínimo del cuerpo de las noticias (contenido propio del seed, no de usuarios):
 * párrafos, "## subtítulo" y listas con "- ". Sin HTML crudo.
 * Los subtítulos son h2 (el h1 es el título de la noticia).
 */
export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-10 font-serif text-2xl font-semibold text-ink">
              {block.slice(3)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="mt-5 list-disc space-y-2 pl-6 marker:text-brand-700">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mt-5">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {l}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
