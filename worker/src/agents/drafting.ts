import { db } from "../../../db/index";
import { articles, articleReferences, articleRevisions } from "../../../db/schema";
import { and, desc, eq, isNull, not, or } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DRAFT_MODEL = "claude-haiku-4-5-20251001";   // English drafting
const HEBREW_MODEL = "claude-sonnet-4-5";           // Hebrew generation

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
    model: DRAFT_MODEL,
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
  const prompt = `You are a senior Israeli encyclopedia editor with native Hebrew fluency writing for IsraelPedia — a bilingual Hebrew-English encyclopedia about Israel and Jewish history, culture, religion, science, and communities.

Your task: produce a high-quality Hebrew encyclopedia article about "${englishTitle}" based on the English source article below. This is NOT a mechanical translation — it is a Hebrew article that conveys the same knowledge in authentic, fluent Modern Israeli Hebrew.

LANGUAGE REQUIREMENTS:
- Write in Modern Israeli Hebrew (עברית ישראלית מודרנית) as used in quality Israeli newspapers, academic publications, and reference works like the Hebrew Wikipedia.
- Never produce word-for-word translation. Restructure sentences to follow natural Hebrew syntax.
- Idioms, expressions, and sentence constructions must be natural Hebrew — not English sentences mapped to Hebrew words.
- Use standard Israeli Hebrew terms for all concepts, places, and people (e.g. ירושלים not ג'רוסלם, משה רבנו not מושה).
- For foreign names with no standard Hebrew form, use accepted Israeli phonetic transliteration.
- Dates and numbers written naturally in Hebrew context.

STRUCTURE REQUIREMENTS:
- Preserve all Markdown formatting exactly: ## headings stay ## headings in Hebrew, **bold** stays **bold**, bullet lists stay bullet lists.
- Article structure and section order should match the English source.
- Do NOT add RTL unicode marks — the UI handles direction.

QUALITY CHECK — before outputting, verify:
- Every sentence reads naturally to a native Hebrew speaker.
- No sentence is a literal word-for-word mapping from English.
- All proper nouns use their correct standard Hebrew forms.
- The text flows naturally when read right-to-left.

English source:
Title: ${englishTitle}
Summary: ${englishSummary}
Body:
${englishBody}

Respond using EXACTLY this format with the three delimiters on their own lines — no other text:
===TITLE_HE===
כותרת בעברית
===SUMMARY_HE===
תקציר בעברית
===BODY_HE===
גוף המאמר בעברית בפורמט Markdown`;

  const message = await client.messages.create({
    model: HEBREW_MODEL,
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
