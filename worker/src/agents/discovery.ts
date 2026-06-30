import { db } from "../../../db/index";
import { suggestions } from "../../../db/schema";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export async function runDiscovery(): Promise<void> {
  console.log("[Discovery] Starting...");

  const prompt = `You are a topic discovery agent for IsraelPedia — an online encyclopedia focused on Israel and Jewish history, culture, religion, language, science, notable people, and communities worldwide.

Suggest 2 new article topics that would make valuable additions to this encyclopedia. Each topic should be notable and factual with enough depth to support a full encyclopedia article.

CRITICAL — Title format rules. The title must be the NAME of the thing only — nothing else.

✅ CORRECT examples (short, clean, just the name):
- "Dead Sea Scrolls"
- "Yitzhak Rabin"
- "Kibbutz Movement"
- "Israeli Air Force"
- "Western Wall"
- "Hebrew University"

❌ WRONG examples (too long, descriptive, uses colons or subtitles — NEVER do this):
- "The Dead Sea Scrolls: History, Discovery, and Religious Significance" → WRONG
- "Yitzhak Rabin and the Oslo Peace Process: A Political Biography" → WRONG
- "The Role of the Israeli Air Force in Modern Middle Eastern Conflicts" → WRONG
- "History and Cultural Significance of the Western Wall in Judaism" → WRONG

Rules:
- 1 to 4 words maximum in most cases. 5 words only if truly necessary (e.g. "Battle of the Bulge").
- No colons. No subtitles. No parenthetical dates. No descriptive phrases.
- Just the name.

Respond ONLY in this JSON format — no markdown, no explanation:
[
  { "topic": "Topic Name", "rationale": "Why this topic belongs in IsraelPedia and what the article would cover." }
]`;

  let proposals: { topic: string; rationale: string }[] = [];
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as any).text as string;
    proposals = JSON.parse(extractJson(text));
    console.log(`[Discovery] Claude proposed ${proposals.length} topics`);
  } catch (err) {
    console.error("[Discovery] Anthropic call or JSON parse failed:", err);
    return;
  }

  // Dedup within this batch only — cross-batch and fuzzy dedup is handled by triage
  const seenThisRun = new Set<string>();
  let inserted = 0;

  for (const p of proposals) {
    if (!p.topic?.trim() || !p.rationale?.trim()) continue;
    const key = p.topic.toLowerCase().trim();
    if (seenThisRun.has(key)) {
      console.log(`[Discovery] Skip in-batch duplicate: "${p.topic}"`);
      continue;
    }
    seenThisRun.add(key);

    await db.insert(suggestions).values({
      topic: p.topic.trim(),
      rationale: p.rationale.trim(),
      suggestedBy: null,
      status: "pending",
    });
    inserted++;
    console.log(`[Discovery] Inserted: "${p.topic}"`);
  }

  console.log(`[Discovery] Done — inserted ${inserted} new suggestions.`);
}
