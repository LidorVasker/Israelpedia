import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveArticle } from "./actions";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [article] = await db.select().from(articles).where(eq(articles.slug, slug));

  if (!article || article.status === "archived") notFound();
  if (article.status !== "published" && !isAdmin) notFound();

  const archiveWithId = archiveArticle.bind(null, article.id);

  return (
    <main style={{ padding: "2rem", maxWidth: 720 }}>
      <Link href="/">← Back</Link>

      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", margin: "1rem 0 0.25rem" }}>
        <h1 style={{ margin: 0 }}>{article.title}</h1>
        {isAdmin && (
          <>
            <Link href={`/admin/edit/${article.slug}`} style={{ fontSize: "0.85rem", color: "#0070f3" }}>
              Edit
            </Link>
            <form action={archiveWithId} style={{ display: "inline" }}>
              <button
                type="submit"
                style={{
                  fontSize: "0.85rem",
                  color: "red",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Delete
              </button>
            </form>
          </>
        )}
      </div>

      {article.summary && (
        <p style={{ color: "#555", margin: "0 0 1.5rem" }}>{article.summary}</p>
      )}

      <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{article.body}</div>
    </main>
  );
}
