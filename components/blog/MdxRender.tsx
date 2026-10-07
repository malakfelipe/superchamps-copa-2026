import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import type { MDXComponents } from "mdx/types"

/**
 * Renderiza MDX server-side com componentes customizados.
 * Usa next-mdx-remote/rsc — fica fora do bundle do client.
 *
 * Custom components: links viram <Link> do Next, headings ganham id pra anchor,
 * tabelas têm scroll horizontal no mobile.
 */
const components: MDXComponents = {
  // Link: usa <Link> do Next pra internos, <a> normal pra externos
  a: ({ href, children, ...rest }) => {
    const isExternal = href?.startsWith("http")
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href || "#"} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    )
  },
  // Tabela: wrap em div com overflow-x pra mobile
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b-2 border-border px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border px-3 py-2">{children}</td>,
  // Blockquote estilizado
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 italic text-foreground/80 my-4">
      {children}
    </blockquote>
  ),
  // Imagens com alt obrigatório, lazy
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : ""}
      alt={alt || ""}
      loading="lazy"
      className="rounded-lg my-6 w-full"
    />
  ),
}

export function MdxRender({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      }}
    />
  )
}
