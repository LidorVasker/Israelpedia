import { db } from "../../../db/index";
import { suggestions } from "../../../db/schema";
import Anthropic from "@anthropic-ai/sdk";
import { VALID_CATEGORIES } from "../lib/dedup";
import { getCategoryCoverage, getRecentTitles } from "../lib/coverage";

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

export async function runDiscoveryBasic(): Promise<void> {
  console.log("[DiscoveryBasic] Starting...");

  const [coverage, recentTitles] = await Promise.all([
    getCategoryCoverage(),
    getRecentTitles(50),
  ]);

  // Sort categories by count ascending so the most underrepresented appear first
  const sortedCoverage = Object.entries(coverage).sort(([, a], [, b]) => a - b);
  const coverageLines = sortedCoverage
    .map(([cat, count]) => `  ${cat}: ${count}`)
    .join("\n");

  const recentBlock =
    recentTitles.length > 0
      ? recentTitles.map((t) => `- ${t}`).join("\n")
      : "(none yet)";

  const prompt = `You are a coverage-driven topic discovery agent for IsraelPedia — an online encyclopedia focused on Israel and Jewish history, culture, religion, language, science, notable people, and communities worldwide.

YOUR MISSION: Propose 8 article topics that fill the biggest gaps in the encyclopedia's current coverage. The goal is a balanced, comprehensive reference — not adding more articles to categories that are already well represented.

CURRENT CATEGORY COVERAGE (sorted fewest first — focus on the TOP of this list):
${coverageLines}

Steer your proposals toward the categories with the lowest counts. If a category has 0 articles, treat it as a priority. Avoid proposing more topics in categories that already have many articles unless the other categories are already well-covered.

SCOPE: Topics must have a direct, meaningful connection to Israel or Jewish history, culture, religion, language, science, notable people, or communities worldwide. Do not suggest topics outside this scope.

RECENT TITLES — do not propose these or close variants (recency guard only — the duplicate check runs separately):
${recentBlock}

TITLE FORMAT — CRITICAL:
- Titles must be SHORT and CLEAN: 1 to 4 words in most cases.
- Think Wikipedia: "Dead Sea", "Passover", "Iron Dome", "Golda Meir".
- NEVER use colons, subtitles, or long descriptive phrases in the title.
- The title is the name of the thing, person, place, event, or concept — nothing more.

VALID CATEGORIES (pick the best fit for each proposal):
${VALID_CATEGORIES.join(", ")}

Respond ONLY in this JSON format — no markdown, no explanation:
[
  { "topic": "Topic Name", "rationale": "Why this topic belongs in IsraelPedia and what the article would cover.", "category": "category_value" }
]`;

  let proposals: { topic: string; rationale: string; category?: string }[] = [];
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1536,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (message.content[0] as any).text as string;
    proposals = JSON.parse(extractJson(text));
    console.log(`[DiscoveryBasic] Claude proposed ${proposals.length} topics`);
  } catch (err) {
    console.error("[DiscoveryBasic] Anthropic call or JSON parse failed:", err);
    return;
  }

  // Dedup within this batch only — cross-batch and fuzzy dedup is handled by triage
  const seenThisRun = new Set<string>();
  let inserted = 0;

  for (const p of proposals) {
    if (!p.topic?.trim() || !p.rationale?.trim()) continue;
    const key = p.topic.toLowerCase().trim();
    if (seenThisRun.has(key)) {
      console.log(`[DiscoveryBasic] Skip in-batch duplicate: "${p.topic}"`);
      continue;
    }
    seenThisRun.add(key);

    const category =
      p.category && (VALID_CATEGORIES as readonly string[]).includes(p.category)
        ? p.category
        : null;

    await db.insert(suggestions).values({
      topic: p.topic.trim(),
      rationale: p.rationale.trim(),
      suggestedBy: null,
      status: "pending",
      category: category ?? undefined,
    });
    inserted++;
    console.log(
      `[DiscoveryBasic] Inserted: "${p.topic}"${category ? ` [${category}]` : ""}`
    );
  }

  console.log(`[DiscoveryBasic] Done — inserted ${inserted} new suggestions.`);
}
