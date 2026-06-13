// app/admin/page.tsx
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { articles, suggestions, users } from "@/db/schema";
import { eq, desc, ilike } from "drizzle-orm";
import Link from "next/link";
import { acceptSuggestion, rejectSuggestion, archiveArticle } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim();

  const allArticles = await db
    .select()
    .from(articles)
    .where(query ? ilike(articles.title, `%${query}%`) : undefined)
    .orderBy(desc(articles.updatedAt));

  const pendingSuggestions = await db
    .select({
      id: suggestions.id,
      topic: suggestions.topic,
      rationale: suggestions.rationale,
      createdAt: suggestions.createdAt,
      submitterEmail: users.email,
    })
    .from(suggestions)
    .leftJoin(users, eq(suggestions.suggestedBy, users.id))
    .where(eq(suggestions.status, "pending"))
    .orderBy(suggestions.createdAt);

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Admin — Articles</h1>
        <Link href="/">← Back to site</Link>
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "1rem 0" }}>
        <Link href="/admin/new" style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
          + New Article
        </Link>
        <form method="get" style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: 400 }}>
          <input
            name="q"
            type="search"
            defaultValue={query ?? ""}
            placeholder="Search articles…"
            style={{ flex: 1, padding: "0.4rem 0.6rem" }}
          />
          <button type="submit" style={{ padding: "0.4rem 0.8rem" }}>Search</button>
          {query && <a href="/admin" style={{ padding: "0.4rem 0.6rem", color: "#888", alignSelf: "center" }}>Clear</a>}
        </form>
      </div>
      {query && (
        <p style={{ color: "#555", marginBottom: "0.75rem" }}>
          {allArticles.length === 0
            ? `No articles matching "${query}"`
            : `${allArticles.length} article${allArticles.length === 1 ? "" : "s"} matching "${query}"`}
        </p>
      )}
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #333" }}>
            <th style={{ padding: "0.5rem" }}>Title</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Updated</th>
            <th style={{ padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allArticles.map((a) => {
            const doArchive = archiveArticle.bind(null, a.id);
            return (
              <tr key={a.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "0.5rem" }}>{a.title}</td>
                <td style={{ padding: "0.5rem" }}>{a.status}</td>
                <td style={{ padding: "0.5rem" }}>{new Date(a.updatedAt).toLocaleDateString()}</td>
                <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                  <Link href={`/admin/edit/${a.slug}`} style={{ marginRight: "1rem" }}>
                    Edit
                  </Link>
                  <form action={doArchive} style={{ display: "inline" }}>
                    <button
                      type="submit"
                      style={{ color: "red", background: "none", border: "none",
                               cursor: "pointer", padding: 0 }}
                    >
                      Archive
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
          {allArticles.length === 0 && (
            <tr><td colSpan={4} style={{ padding: "1rem", color: "#888" }}>No articles yet.</td></tr>
          )}
        </tbody>
      </table>
      <h2 style={{ marginTop: "3rem" }}>
        Pending Suggestions{" "}
        <span style={{ fontSize: "0.85rem", background: "#f3f3f3", border: "1px solid #ddd",
                       borderRadius: 4, padding: "0.1rem 0.5rem" }}>
          {pendingSuggestions.length}
        </span>
      </h2>

      {pendingSuggestions.length === 0 ? (
        <p style={{ color: "#888" }}>No pending suggestions.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pendingSuggestions.map((s) => {
            const doAccept = acceptSuggestion.bind(null, s.id);
            const doReject = rejectSuggestion.bind(null, s.id);
            return (
              <div key={s.id} style={{ border: "1px solid #ddd", borderRadius: 4, padding: "1rem" }}>
                <strong>{s.topic}</strong>
                {s.rationale && (
                  <p style={{ margin: "0.25rem 0", color: "#555" }}>{s.rationale}</p>
                )}
                <p style={{ margin: "0.25rem 0 0.75rem", fontSize: "0.85rem", color: "#888" }}>
                  {s.submitterEmail ?? "anonymous"} · {new Date(s.createdAt).toLocaleDateString()}
                </p>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <form action={doAccept}>
                    <button type="submit" style={{ padding: "0.35rem 0.8rem", fontWeight: "bold" }}>
                      Accept
                    </button>
                  </form>
                  <form action={doReject} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input name="reviewNote" required placeholder="Rejection reason"
                      style={{ padding: "0.35rem 0.5rem", width: 220 }} />
                    <button type="submit" style={{ padding: "0.35rem 0.8rem", color: "red" }}>
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}