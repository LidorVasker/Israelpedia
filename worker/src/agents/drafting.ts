import { db } from "../../../db/index";
import { articles, articleReferences, articleRevisions } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_PER_RUN = 3;

interface DraftResponse {
  body: string;
  sources: { title: string; url: string; sourceName: string }[];
}

export async function runDrafting(): Promise<void> {
  console.log("[Drafting] Starting...");

  const toDraft = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "draft"),
        eq(articles.origin, "ai"),
        eq(articles.body, "")
      )
    )
    .limit(MAX_PER_RUN);

  console.log(`[Drafting] Found ${toDraft.length} articles to draft (max ${MAX_PER_RUN} per run).`);

  for (const article of toDraft) {
    const prompt = `You are a writer for IsraelPedia, an authoritative encyclopedia focused on Israel and Jewish history, culture, religion, language, science, notable people, and communities worldwide.

Write a comprehensive encyclopedic article about: "${article.title}"

Requirements:
- Encyclopedic, neutral, and factual tone.
- Well-structured with clear Markdown sections (## headings).
- Approximately 500–800 words.
- Include ONLY real, verifiable sources (books, academic papers, reputable institutions, official websites).
- Do NOT fabricate, invent, or hallucinate any source. If you cannot cite a real source, omit it.

Respond ONLY in this JSON format — no markdown wrapper, no explanation outside the JSON:
{
  "body": "Full article content in Markdown...",
  "sources": [
    { "title": "Source title", "url": "https://real-url.org", "sourceName": "Publisher or organization" }
  ]
}`;

    let draft: DraftResponse;
    try {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const text = (message.content[0] as any).text as string;
      const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.body || typeof parsed.body !== "string") throw new Error("Missing or invalid body in response");
      draft = parsed;
    } catch (err) {
      console.error(`[Drafting] Failed for "${article.title}":`, err);
      continue;
    }

    await db.transaction(async (tx) => {
      // Snapshot the pre-draft (empty) state before writing
      await tx.insert(articleRevisions).values({
        articleId: article.id,
        title: article.title,
        summary: article.summary,
        body: article.body,
        editedBy: null,
        editorNote: "AI draft created by drafting agent",
      });

      // Write the draft and advance to "review" — never "published"
      await tx.update(articles)
        .set({ body: draft.body, status: "review", updatedAt: new Date() })
        .where(eq(articles.id, article.id));

      // Insert sources, skipping any entry with neither title nor url
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
      `[Drafting] Drafted: "${article.title}" — ${draft.body.length} chars, ` +
      `${draft.sources?.length ?? 0} sources`
    );
  }

  console.log("[Drafting] Done.");
}
