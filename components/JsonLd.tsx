/**
 * Renderiza um bloco JSON-LD seguro num <script type="application/ld+json">.
 * Usar em qualquer page/layout pra adicionar structured data (schema.org).
 *
 * Importante: o conteúdo é serializado com JSON.stringify e escapado pra
 * evitar XSS via injeção de "</script>".
 */
type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
