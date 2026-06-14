import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders an article body (Markdown) with the project's typographic styling.
 * The `.prose-article` class in globals.css styles every rendered element.
 * A drop cap is applied only when the body opens with running prose.
 */
export default function ArticleMarkdown({ body }: { body: string }) {
  // Articles often lead with a level-1 heading that repeats the title.
  // The page already renders the title as its <h1>, so strip a single
  // leading H1 to avoid a duplicate (and to let the drop cap land on prose).
  const cleaned = body.replace(/^\s*#\s+.*(\r?\n)+/, "");

  const firstChar = cleaned.trimStart()[0] ?? "";
  const opensWithProse = !"#-*>|`=".includes(firstChar);

  return (
    <div className={`prose-article ${opensWithProse ? "has-dropcap" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Open external links safely in a new tab
          a: ({ href, children, ...props }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
