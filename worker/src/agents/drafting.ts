import { db } from "../../../db/index";
import { articles, articleReferences, articleRevisions } from "../../../db/schema";
import { and, desc, eq, isNull, not, or } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_PER_RUN = 10;

function extractJson(text: string): string {
  const stripped = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  if (stripped.startsWith("{") || stripped.startsWith("[")) return stripped;
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  const start =
    firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)
      ? firstBrace
      : firstBracket;
  if (start < 0) return stripped;
  const endChar = text[start] === "{" ? "}" : "]";
  const end = text.lastIndexOf(endChar);
  return end > start ? text.slice(start, end + 1) : stripped;
}

interface EnglishDraft {
  summary: string;
  body: string;
  sources: { title: string; url: string; sourceName: string }[];
}

interface HebrewTranslation {
  titleHe: string;
  summaryHe: string;
  bodyHe: string;
}

async function draftEnglish(title: string): Promise<EnglishDraft> {
  const prompt = `You are a writer for IsraelPedia, an authoritative encyclopedia focused on Israel and Jewish history, culture, religion, language, science, notable people, and communities worldwide.

Write a comprehensive encyclopedic article about: "${title}"

Requirements:
- Encyclopedic, neutral, and factual tone.
- Well-structured with clear Markdown sections (## headings).
- Approximately 500–800 words.
- Include ONLY real, verifiable sources (books, academic papers, reputable institutions, official websites).
- Do NOT fabricate, invent, or hallucinate any source. If you cannot cite a real source, omit it.

Respond ONLY in this JSON format — no markdown wrapper, no explanation outside the JSON:
{
  "summary": "One or two sentence summary of the topic suitable as an article lead.",
  "body": "Full article content in Markdown...",
  "sources": [
    { "title": "Source title", "url": "https://real-url.org", "sourceName": "Publisher or organization" }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (message.content[0] as any).text as string;
  const parsed = JSON.parse(extractJson(text));
  if (!parsed.body || typeof parsed.body !== "string") throw new Error("Missing or invalid body in English draft");
  return parsed;
}

async function translateToHebrew(
  englishTitle: string,
  englishSummary: string,
  englishBody: string
): Promise<HebrewTranslation> {
  // Use delimiters instead of JSON to avoid JSON-escaping failures on Hebrew text
  // that contains quotes, colons, or other characters Haiku doesn't escape reliably.
  const prompt = `You are an expert translator and encyclopedic writer. Translate the following English encyclopedia article into high-quality Modern Israeli Hebrew.

Requirements:
- Produce fluent, natural Hebrew that reads as if written by a knowledgeable Israeli academic or editor — NOT a word-for-word translation.
- Preserve all Markdown structure exactly: ## headings, **bold**, bullet lists, numbered lists, etc.
- Use the standard Hebrew names for places, people, and concepts as commonly used in Israeli Hebrew (e.g. "Jerusalem" → "ירושלים", "Moses" → "משה").
- Transliterate foreign names that have no standard Hebrew form phonetically.
- Dates, numbers, and technical terms should be rendered naturally in Hebrew.
- The article should read right-to-left naturally — do not add RTL Unicode marks.
- Match the encyclopedic register of the English original.

English title: ${englishTitle}
English summary: ${englishSummary}
English body:
${englishBody}

Respond using EXACTLY this format with the three delimiters on their own lines — no other text:
===TITLE_HE===
כותרת בעברית
===SUMMARY_HE===
תקציר בעברית
===BODY_HE===
גוף המאמר בעברית בפורמט Markdown`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const text = (message.content[0] as any).text as string;

  const titleMatch = text.match(/===TITLE_HE===\s*([\s\S]*?)\s*===SUMMARY_HE===/);
  const summaryMatch = text.match(/===SUMMARY_HE===\s*([\s\S]*?)\s*===BODY_HE===/);
  const bodyMatch = text.match(/===BODY_HE===\s*([\s\S]+)/);

  const titleHe = titleMatch?.[1]?.trim() ?? "";
  const summaryHe = summaryMatch?.[1]?.trim() ?? "";
  const bodyHe = bodyMatch?.[1]?.trim() ?? "";

  if (!bodyHe) throw new Error("Missing bodyHe in Hebrew translation response");
  return { titleHe, summaryHe, bodyHe };
}

export async function runDrafting(): Promise<void> {
  console.log("[Drafting] Starting...");

  const aiOrigins = or(eq(articles.origin, "ai"), eq(articles.origin, "user_suggestion"));

  // ── 1. Articles needing a full English draft (body is empty) ──────────────
  const needsEnglish = await db
    .select()
    .from(articles)
    .where(and(eq(articles.status, "draft"), aiOrigins!, eq(articles.body, "")))
    .orderBy(desc(articles.createdAt))
    .limit(MAX_PER_RUN);

  // ── 2. Articles with English but no Hebrew (failed/missed translation) ────
  const needsHebrew = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "review"),
        aiOrigins!,
        not(eq(articles.body, "")),
        isNull(articles.bodyHe)
      )
    )
    .orderBy(desc(articles.createdAt))
    .limit(MAX_PER_RUN - needsEnglish.length);

  console.log(
    `[Drafting] ${needsEnglish.length} need full draft, ${needsHebrew.length} need Hebrew translation.`
  );

  // ── Full draft: English + Hebrew ──────────────────────────────────────────
  for (const article of needsEnglish) {
    // Step 1: English draft
    let draft: EnglishDraft;
    try {
      draft = await draftEnglish(article.title);
    } catch (err) {
      console.error(`[Drafting] English draft failed for "${article.title}":`, err);
      continue;
    }

    // Step 2: Hebrew translation (non-fatal)
    let hebrew: HebrewTranslation | null = null;
    try {
      hebrew = await translateToHebrew(article.title, draft.summary ?? "", draft.body);
    } catch (err) {
      console.warn(`[Drafting] Hebrew translation failed for "${article.title}" — saving English only:`, err);
    }

    // Step 3: Save everything in one transaction
    await db.transaction(async (tx) => {
      await tx.insert(articleRevisions).values({
        articleId: article.id,
        title: article.title,
        summary: article.summary,
        body: article.body,
        titleHe: article.titleHe,
        summaryHe: article.summaryHe,
        bodyHe: article.bodyHe,
        editedBy: null,
        editorNote: "AI draft created by drafting agent",
      });

      await tx.update(articles)
        .set({
          summary: draft.summary || null,
          body: draft.body,
          titleHe: hebrew?.titleHe || article.titleHe || null,
          summaryHe: hebrew?.summaryHe || null,
          bodyHe: hebrew?.bodyHe || null,
          status: "review",
          updatedAt: new Date(),
        })
        .where(eq(articles.id, article.id));

      for (const source of draft.sources ?? []) {
        if (!source.title && !source.url) continue;
        await tx.insert(articleReferences).values({
          articleId: article.id,
          title: source.title || null,
          url: source.url || null,
          sourceName: source.sourceName || null,
        });
      }
    });

    console.log(
      `[Drafting] "${article.title}" — EN: ${draft.body.length} chars` +
      (hebrew ? `, HE: ${hebrew.bodyHe.length} chars` : ", HE: skipped") +
      `, ${draft.sources?.length ?? 0} sources`
    );
  }

  // ── Hebrew-only retry: translate articles that previously missed Hebrew ───
  for (const article of needsHebrew) {
    let hebrew: HebrewTranslation;
    try {
      hebrew = await translateToHebrew(article.title, article.summary ?? "", article.body);
    } catch (err) {
      console.error(`[Drafting] Hebrew retry failed for "${article.title}":`, err);
      continue;
    }

    await db.update(articles)
      .set({
        titleHe: hebrew.titleHe || article.titleHe || null,
        summaryHe: hebrew.summaryHe || null,
        bodyHe: hebrew.bodyHe,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, article.id));

    console.log(`[Drafting] Hebrew retry: "${article.title}" — ${hebrew.bodyHe.length} chars`);
  }

  console.log("[Drafting] Done.");
}
