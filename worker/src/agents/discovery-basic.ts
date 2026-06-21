import { db } from "../../../db/index";
import { articles, suggestions } from "../../../db/schema";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runDiscoveryBasic(): Promise<void> {
  console.log("[DiscoveryBasic] Starting...");

  const existingArticles    = await db.select({ title: articles.title }).from(articles);
  const existingSuggestions = await db.select({ topic: suggestions.topic }).from(suggestions);

  const existingTopics = [
    ...existingArticles.map((a) => a.title),
    ...existingSuggestions.map((s) => s.topic),
  ];

  const prompt = `You are a topic discovery agent for IsraelPedia — an online encyclopedia focused on Israel and Jewish history, culture, religion, language, science, notable people, and communities worldwide.

Your job is to propose 8 foundational, everyday topics that a general audience would commonly search for. Focus on these categories:

- Israeli cities and regions (e.g. Tel Aviv, Haifa, Eilat, Negev Desert, Galilee)
- Israeli food and cuisine (e.g. Falafel, Hummus, Shakshuka, Israeli breakfast)
- Israeli inventions and technology (e.g. Drip irrigation, Iron Dome, USB flash drive, Waze)
- Israeli government and institutions (e.g. Knesset, Israel Defense Forces, Mossad, Bank of Israel)
- Jewish holidays and traditions (e.g. Passover, Hanukkah, Rosh Hashanah, Shabbat, Bar Mitzvah)
- Notable Israeli and Jewish figures (e.g. David Ben-Gurion, Golda Meir, Theodor Herzl, Albert Einstein)
- Israeli nature and geography (e.g. Dead Sea, Sea of Galilee, Jordan River, Mount Hermon)
- Israeli sports (e.g. Maccabi Tel Aviv, Israeli national football team)

CRITICAL — Title format rules:
- Titles must be SHORT and CLEAN: 1 to 4 words in most cases.
- Think like Wikipedia: "Dead Sea", "Passover", "Iron Dome", "Golda Meir".
- NEVER use colons, subtitles, or long descriptive phrases in the title.
- The title should be the name of the thing, person, place, event, or concept — nothing more.

Existing topics to AVOID (do not suggest these or close variants):
${existingTopics.map((t) => `- ${t}`).join("\n") || "(none yet)"}

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
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    proposals = JSON.parse(clean);
    console.log(`[DiscoveryBasic] Claude proposed ${proposals.length} topics`);
  } catch (err) {
    console.error("[DiscoveryBasic] Anthropic call or JSON parse failed:", err);
    return;
  }

  const existingLower = existingTopics.map((t) => t.toLowerCase());
  let inserted = 0;

  for (const p of proposals) {
    if (!p.topic?.trim() || !p.rationale?.trim()) continue;
    const topicLower = p.topic.toLowerCase();
    const isDuplicate = existingLower.some(
      (t) => t === topicLower || t.includes(topicLower) || topicLower.includes(t)
    );
    if (isDuplicate) {
      console.log(`[DiscoveryBasic] Skip duplicate: "${p.topic}"`);
      continue;
    }
    await db.insert(suggestions).values({
      topic: p.topic.trim(),
      rationale: p.rationale.trim(),
      suggestedBy: null,
      status: "pending",
    });
    inserted++;
    console.log(`[DiscoveryBasic] Inserted: "${p.topic}"`);
  }

  console.log(`[DiscoveryBasic] Done — inserted ${inserted} new suggestions.`);
}
