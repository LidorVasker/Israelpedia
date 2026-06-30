import { db } from "../../../db/index";
import { articles, suggestions } from "../../../db/schema";
import { not, eq, sql, desc } from "drizzle-orm";
import { VALID_CATEGORIES } from "./dedup";

/**
 * Returns a count of non-archived articles per category.
 * All categories in VALID_CATEGORIES are included, even those with zero articles.
 * Single aggregate query — stays fast at any article count.
 */
export async function getCategoryCoverage(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      category: articles.category,
      count: sql<number>`count(*)::int`,
    })
    .from(articles)
    .where(not(eq(articles.status, "archived")))
    .groupBy(articles.category);

  const coverage: Record<string, number> = {};
  for (const cat of VALID_CATEGORIES) {
    coverage[cat] = 0;
  }
  for (const row of rows) {
    const key = row.category ?? "other";
    if (key in coverage) {
      coverage[key] = row.count;
    } else {
      coverage["other"] += row.count;
    }
  }
  return coverage;
}

/**
 * Returns the most recent ~50 article/suggestion titles combined,
 * used as a lightweight recency guard in discovery prompts.
 * Not the source of truth for deduplication — triage's trigram check handles that.
 */
export async function getRecentTitles(limit = 50): Promise<string[]> {
  const half = Math.ceil(limit / 2);

  const [recentArticles, recentSuggestions] = await Promise.all([
    db
      .select({ title: articles.title })
      .from(articles)
      .where(not(eq(articles.status, "archived")))
      .orderBy(desc(articles.createdAt))
      .limit(half),
    db
      .select({ title: suggestions.topic })
      .from(suggestions)
      .orderBy(desc(suggestions.createdAt))
      .limit(half),
  ]);

  const seen = new Set<string>();
  const titles: string[] = [];
  for (const { title } of recentArticles) {
    if (!seen.has(title)) { seen.add(title); titles.push(title); }
  }
  for (const { title } of recentSuggestions) {
    if (!seen.has(title)) { seen.add(title); titles.push(title); }
  }
  return titles.slice(0, limit);
}
