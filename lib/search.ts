import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
}

export async function searchArticles(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  // Full-text search ranked by relevance
  const ftsResults = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        sql`to_tsvector('english', ${articles.title} || ' ' || coalesce(${articles.body}, '')) @@ plainto_tsquery('english', ${q})`
      )
    )
    .orderBy(
      sql`ts_rank(
        to_tsvector('english', ${articles.title} || ' ' || coalesce(${articles.body}, '')),
        plainto_tsquery('english', ${q})
      ) DESC`
    )
    .limit(20);

  // ILIKE fallback — catches partial matches FTS misses (e.g. "tel avi" → "Tel Aviv")
  const ftsIdSet = new Set(ftsResults.map((r) => r.id));

  const ilikeResults = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        or(
          ilike(articles.title, `%${q}%`),
          ilike(articles.summary, `%${q}%`)
        )
      )
    )
    .limit(10);

  // FTS results first, then ILIKE results not already returned
  return [
    ...ftsResults,
    ...ilikeResults.filter((r) => !ftsIdSet.has(r.id)),
  ];
}
