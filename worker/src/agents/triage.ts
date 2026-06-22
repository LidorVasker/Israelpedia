import { db } from "../../../db/index";
import { articles, suggestions } from "../../../db/schema";
import { eq } from "drizzle-orm";
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

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type TriageDecision =
  | { decision: "reject"; reason: string }
  | { decision: "accept"; reason: string; englishTitle: string; hebrewTitle?: string };

export async function runTriage(): Promise<void> {
  console.log("[Triage] Starting...");

  const pending = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.status, "pending"));

  console.log(`[Triage] Found ${pending.length} pending suggestions to triage.`);

  for (const suggestion of pending) {
    const prompt = `You are a strict scope-enforcement agent for IsraelPedia — an encyclopedia EXCLUSIVELY covering topics connected to Israel or Jewish history, culture, religion, language, science, notable people, and Jewish communities worldwide.

The topic suggestion may be written in English OR in Hebrew. Evaluate it regardless of language.

Your job: decide if the proposed topic belongs in IsraelPedia. Be strict. If there is no clear, direct connection to Israel or Jewish topics, REJECT it.

ACCEPT examples:
- "Tel Aviv" / "תל אביב" → accept (major Israeli city)
- "Albert Einstein" / "אלברט איינשטיין" → accept (Jewish scientist)
- "Hanukkah" / "חנוכה" → accept (Jewish holiday)
- "Hebrew language" / "שפה עברית" → accept
- "Yitzhak Rabin" / "יצחק רבין" → accept (Israeli prime minister)

REJECT examples:
- "New York Knicks" → reject (no Jewish/Israeli connection)
- "iPhone 15" → reject (no connection)
- "World War II" → reject (too broad; "Holocaust" or "Jews in World War II" would be acceptable)

Topic to evaluate: "${suggestion.topic}"
Rationale provided: "${suggestion.rationale ?? "None provided"}"

Rules:
- Accept ONLY if the topic has a direct, meaningful connection to Israel or Jewish history/culture/religion/language/science/communities.
- Reject if the connection is tenuous, incidental, or non-existent.
- If the topic is a person, they must be Jewish, Israeli, or have significant documented ties to Israel or Jewish history.

If ACCEPTING, you must provide:
- "englishTitle": the bare name of the subject — nothing else. Think: Wikipedia article title. 1–4 words in most cases.
  CRITICAL cleanup examples — always apply this logic:
  ✅ Input: "Josephus Flavius: Historian, Eyewitness, Jewish-Roman Relations, and Historical Reliability" → "Josephus Flavius"
  ✅ Input: "The Babylonian Exile and the Restoration (586-516 BCE): Displacement, Diaspora Formation" → "Babylonian Exile"
  ✅ Input: "Jewish Printing and Publishing in Early Modern Europe: Hebrew Printing Press, Book Production" → "Hebrew Printing Press"
  ✅ Input: "Israeli Air Force" → "Israeli Air Force"  (already clean — leave it)
  ✅ Input: "חנוכה" → "Hanukkah"  (Hebrew → English equivalent)
  NEVER output a colon, a subtitle, or a phrase longer than 5 words.
- "hebrewTitle": the Hebrew title for this article (standard Israeli Hebrew form; omit if unsure).

Respond ONLY in this JSON format — no markdown, no explanation:
{ "decision": "reject", "reason": "..." }
or
{ "decision": "accept", "reason": "...", "englishTitle": "Clean English Title", "hebrewTitle": "כותרת בעברית" }`;

    let decision: TriageDecision;
    try {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const text = (message.content[0] as any).text as string;
      decision = JSON.parse(extractJson(text));
    } catch (err) {
      console.error(`[Triage] Anthropic call failed for "${suggestion.topic}":`, err);
      continue;
    }

    const origin = suggestion.suggestedBy ? "user_suggestion" : "ai";

    if (decision.decision === "accept") {
      const englishTitle = decision.englishTitle?.trim() || suggestion.topic;
      const hebrewTitle = decision.hebrewTitle?.trim() || null;
      const slug = slugify(englishTitle);

      await db.transaction(async (tx) => {
        const [article] = await tx
          .insert(articles)
          .values({
            slug,
            title: englishTitle,
            titleHe: hebrewTitle,
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
      console.log(`[Triage] ACCEPTED (${origin}): "${englishTitle}"${hebrewTitle ? ` / "${hebrewTitle}"` : ""}`);
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
