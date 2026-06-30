/**
 * Deduplication utilities for the pipeline.
 *
 * Uses pg_trgm similarity() to find near-duplicate topics in articles and
 * pending suggestions without loading all rows into memory. For borderline
 * cases where string similarity alone is inconclusive, a cheap Haiku LLM
 * call makes the final call.
 *
 * Thresholds:
 *   similarity >= AUTO_DUPLICATE  → same topic, no LLM needed
 *   similarity in [BORDERLINE, AUTO_DUPLICATE) → ask LLM
 *   similarity < BORDERLINE       → clearly different, not a duplicate
 */
import { db } from "../../../db/index";
import { articles, suggestions } from "../../../db/schema";
import { and, isNull, not, eq, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Minimum similarity score to even consider as a candidate */
const QUERY_THRESHOLD = 0.5;

/** At or above this score → auto-duplicate, no LLM call */
export const AUTO_DUPLICATE = 0.85;

/** At or above this score (but below AUTO_DUPLICATE) → ask LLM */
export const BORDERLINE = 0.55;

export interface SimilarMatch {
  title: string;
  id: string;
  type: "article" | "suggestion";
  similarity: number;
}

/**
 * Find the closest existing topic to `title` (and optionally `titleHe`).
 * Checks:
 *   - articles.title  (all non-archived articles)
 *   - articles.titleHe (if titleHe provided)
 *   - suggestions.topic (pending suggestions only — accepted ones have articles)
 *
 * Returns the single best match above QUERY_THRESHOLD, or { found: false }.
 */
export async function findSimilarTopic(
  title: string,
  titleHe?: string
): Promise<{ found: boolean; match?: SimilarMatch }> {
  const candidates: SimilarMatch[] = [];

  // ── articles.title ──────────────────────────────────────────────────────────
  const [byTitle] = await db
    .select({
      id: articles.id,
      title: articles.title,
      sim: sql<number>`similarity(${articles.title}, ${title})`,
    })
    .from(articles)
    .where(
      and(
        not(eq(articles.status, "archived")),
        sql`similarity(${articles.title}, ${title}) > ${QUERY_THRESHOLD}`
      )
    )
    .orderBy(sql`similarity(${articles.title}, ${title}) DESC`)
    .limit(1);

  if (byTitle) candidates.push({ title: byTitle.title, id: byTitle.id, type: "article", similarity: byTitle.sim });

  // ── articles.titleHe ────────────────────────────────────────────────────────
  if (titleHe) {
    const [byTitleHe] = await db
      .select({
        id: articles.id,
        title: articles.title,
        sim: sql<number>`similarity(${articles.titleHe}, ${titleHe})`,
      })
      .from(articles)
      .where(
        and(
          not(eq(articles.status, "archived")),
          not(isNull(articles.titleHe)),
          sql`similarity(${articles.titleHe}, ${titleHe}) > ${QUERY_THRESHOLD}`
        )
      )
      .orderBy(sql`similarity(${articles.titleHe}, ${titleHe}) DESC`)
      .limit(1);

    if (byTitleHe) candidates.push({ title: byTitleHe.title, id: byTitleHe.id, type: "article", similarity: byTitleHe.sim });
  }

  // ── pending suggestions ─────────────────────────────────────────────────────
  const [bySuggestion] = await db
    .select({
      id: suggestions.id,
      title: suggestions.topic,
      sim: sql<number>`similarity(${suggestions.topic}, ${title})`,
    })
    .from(suggestions)
    .where(
      and(
        eq(suggestions.status, "pending"),
        sql`similarity(${suggestions.topic}, ${title}) > ${QUERY_THRESHOLD}`
      )
    )
    .orderBy(sql`similarity(${suggestions.topic}, ${title}) DESC`)
    .limit(1);

  if (bySuggestion) candidates.push({ ...bySuggestion, type: "suggestion", similarity: bySuggestion.sim });

  if (candidates.length === 0) return { found: false };

  const best = candidates.reduce((a, b) => (a.similarity > b.similarity ? a : b));
  return { found: true, match: best };
}

/**
 * Ask Haiku whether two topic titles refer to the same real-world subject.
 * Only called when similarity falls in the borderline range.
 * Returns false on any error (fail open — don't reject a valid topic on LLM failure).
 */
export async function isSameTopicLLM(titleA: string, titleB: string): Promise<boolean> {
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [
        {
          role: "user",
          content: `Do these two titles refer to the same real-world subject? Answer ONLY with valid JSON — no other text.
{"same": true} or {"same": false}

Title A: "${titleA}"
Title B: "${titleB}"`,
        },
      ],
    });
    const text = (message.content[0] as any).text as string;
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return false;
    const parsed = JSON.parse(text.slice(start, end + 1));
    return parsed.same === true;
  } catch {
    return false;
  }
}

/**
 * Valid category values for IsraelPedia articles.
 * Used in LLM prompts and validated before writing to DB.
 */
export const VALID_CATEGORIES = [
  "people",
  "places",
  "history",
  "religion_and_culture",
  "holidays_and_traditions",
  "language",
  "science_and_technology",
  "government_and_politics",
  "military_and_security",
  "sports",
  "food_and_cuisine",
  "nature_and_geography",
  "organizations",
  "art_and_media",
  "other",
] as const;

export type ArticleCategory = (typeof VALID_CATEGORIES)[number];

export function validateCategory(raw: string | undefined | null): ArticleCategory | null {
  if (!raw) return null;
  return (VALID_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as ArticleCategory)
    : "other";
}
