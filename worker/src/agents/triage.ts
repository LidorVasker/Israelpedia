import { db } from "../../../db/index";
import { articles, suggestions } from "../../../db/schema";
import { and, eq, isNull } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function runTriage(): Promise<void> {
  console.log("[Triage] Starting...");

  const pending = await db
    .select()
    .from(suggestions)
    .where(and(eq(suggestions.status, "pending"), isNull(suggestions.suggestedBy)));

  console.log(`[Triage] Found ${pending.length} AI-discovered suggestions to triage.`);

  for (const suggestion of pending) {
    const prompt = `You are a triage agent for IsraelPedia — an encyclopedia covering Israel and Jewish history, culture, religion, language, science, notable people, and communities worldwide.

Decide if this proposed topic is appropriate for IsraelPedia:
Topic: "${suggestion.topic}"
Rationale: "${suggestion.rationale ?? "None provided"}"

Accept if: the topic is genuinely connected to Israel or Jewish history/culture/religion/science/communities, has enough factual depth for a full article, and is not overly narrow or controversial without encyclopedic merit.

Respond ONLY in this JSON format — no markdown, no explanation:
{ "decision": "accept", "reason": "..." }
or
{ "decision": "reject", "reason": "..." }`;

    let decision: { decision: "accept" | "reject"; reason: string };
    try {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const text = (message.content[0] as any).text as string;
      const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      decision = JSON.parse(clean);
    } catch (err) {
      console.error(`[Triage] Anthropic call failed for "${suggestion.topic}":`, err);
      continue;
    }

    if (decision.decision === "accept") {
      const slug = slugify(suggestion.topic);
      await db.transaction(async (tx) => {
        const [article] = await tx
          .insert(articles)
          .values({
            slug,
            title: suggestion.topic,
            body: "",
            status: "draft",
            origin: "ai",
            createdBy: null,
          })
          .returning({ id: articles.id });

        await tx
          .update(suggestions)
          .set({ status: "accepted", articleId: article.id })
          .where(eq(suggestions.id, suggestion.id));
      });
      console.log(`[Triage] ACCEPTED: "${suggestion.topic}"`);
    } else {
      await db
        .update(suggestions)
        .set({ status: "rejected", reviewNote: decision.reason })
        .where(eq(suggestions.id, suggestion.id));
      console.log(`[Triage] REJECTED: "${suggestion.topic}" — ${decision.reason}`);
    }
  }

  console.log("[Triage] Done.");
}
