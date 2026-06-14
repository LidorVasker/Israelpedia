import { db } from "../../../db/index";
import { articles, suggestions } from "../../../db/schema";
import { eq } from "drizzle-orm";
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
    .where(eq(suggestions.status, "pending"));

  console.log(`[Triage] Found ${pending.length} pending suggestions to triage.`);

  for (const suggestion of pending) {
    const prompt = `You are a strict scope-enforcement agent for IsraelPedia — an encyclopedia EXCLUSIVELY covering topics connected to Israel or Jewish history, culture, religion, language, science, notable people, and Jewish communities worldwide.

Your job: decide if the proposed topic belongs in IsraelPedia. Be strict. If there is no clear, direct connection to Israel or Jewish topics, REJECT it.

ACCEPT examples (clear connection):
- "Tel Aviv" → accept (major Israeli city)
- "Albert Einstein" → accept (Jewish scientist, profound cultural significance)
- "Hanukkah" → accept (Jewish holiday)
- "Hebrew language" → accept (language of Israel and Jewish liturgy)
- "Yitzhak Rabin" → accept (Israeli prime minister)

REJECT examples (no connection):
- "New York Knicks" → reject (American sports team, no Jewish/Israeli connection)
- "iPhone 15" → reject (consumer electronics, no connection)
- "Amazon rainforest" → reject (geography unrelated to Israel or Judaism)
- "Taylor Swift" → reject (American pop star, no Jewish/Israeli connection)
- "World War II" → reject (too broad; a topic like "Jewish experience in World War II" or "Holocaust" would be acceptable instead)

Topic to evaluate: "${suggestion.topic}"
Rationale provided: "${suggestion.rationale ?? "None provided"}"

Rules:
- Accept ONLY if the topic has a direct, meaningful connection to Israel or Jewish history/culture/religion/language/science/communities.
- Reject if the connection is tenuous, incidental, or non-existent.
- Reject if the topic is too broad and not specifically about Israel or Jewish subjects.
- If the topic is a person, they must be Jewish, Israeli, or have significant documented ties to Israel or Jewish history.

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

    const origin = suggestion.suggestedBy ? "user_suggestion" : "ai";

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
            origin,
            createdBy: null,
          })
          .returning({ id: articles.id });

        await tx
          .update(suggestions)
          .set({ status: "accepted", articleId: article.id })
          .where(eq(suggestions.id, suggestion.id));
      });
      console.log(`[Triage] ACCEPTED (${origin}): "${suggestion.topic}"`);
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
