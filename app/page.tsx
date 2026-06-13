import { auth } from "@/auth";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq, ilike, or, desc } from "drizzle-orm";
import Link from "next/link";
import AuthButtons from "@/components/auth-buttons";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";
  const { q } = await searchParams;
  const query = q?.trim();

  const whereClause = query
    ? and(
        eq(articles.status, "published"),
        or(ilike(articles.title, `%${query}%`), ilike(articles.summary, `%${query}%`))
      )
    : eq(articles.status, "published");

  const published = await db
    .select({ id: articles.id, slug: articles.slug, title: articles.title, summary: articles.summary })
    .from(articles)
    .where(whereClause)
    .orderBy(desc(articles.publishedAt));

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>IsraelPedia</h1>
        <AuthButtons />
      </div>

      <form method="get" style={{ margin: "1.5rem 0 1rem", display: "flex", gap: "0.5rem", maxWidth: 480 }}>
        <input
          name="q"
          type="search"
          defaultValue={query ?? ""}
          placeholder="Search articles…"
          style={{ flex: 1, padding: "0.5rem 0.75rem", fontSize: "1rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>Search</button>
        {query && (
          <Link href="/" style={{ padding: "0.5rem 0.75rem", color: "#888", alignSelf: "center" }}>
            Clear
          </Link>
        )}
      </form>

      {isAdmin && (
        <Link
          href="/admin/new"
          style={{ display: "inline-block", marginBottom: "1rem", fontWeight: "bold" }}
        >
          + New Article
        </Link>
      )}

      {query && (
        <p style={{ color: "#555", marginBottom: "0.75rem" }}>
          {published.length === 0
            ? `No results for "${query}"`
            : `${published.length} result${published.length === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {published.map((a) => (
          <li key={a.id} style={{ borderBottom: "1px solid #eee", padding: "0.75rem 0" }}>
            <Link href={`/article/${a.slug}`} style={{ fontWeight: "bold" }}>
              {a.title}
            </Link>
            {a.summary && (
              <p style={{ margin: "0.25rem 0 0", color: "#555" }}>{a.summary}</p>
            )}
          </li>
        ))}
        {published.length === 0 && !query && (
          <li style={{ color: "#888", paddingTop: "0.75rem" }}>No articles published yet.</li>
        )}
      </ul>
    </main>
  );
}
