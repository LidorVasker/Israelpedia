"use server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, desc, eq, isNull, not } from "drizzle-orm";

export type ArticleCard = {
  id: string;
  slug: string;
  title: string | null;
  summary: string | null;
  titleHe: string | null;
  summaryHe: string | null;
};

export async function fetchMoreArticles(offset: number, limit: number): Promise<ArticleCard[]> {
  return db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      titleHe: articles.titleHe,
      summaryHe: articles.summaryHe,
    })
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .offset(offset)
    .limit(limit);
}

export async function fetchMoreHebrewArticles(offset: number, limit: number): Promise<ArticleCard[]> {
  return db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      titleHe: articles.titleHe,
      summaryHe: articles.summaryHe,
    })
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        not(isNull(articles.titleHe)),
        not(isNull(articles.bodyHe))
      )
    )
    .orderBy(desc(articles.publishedAt))
    .offset(offset)
    .limit(limit);
}
