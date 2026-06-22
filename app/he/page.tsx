import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq, not, isNull, desc } from "drizzle-orm";
import Link from "next/link";

const TOPICS_HE = [
  { label: "אנשים", query: "People" },
  { label: "היסטוריה", query: "History" },
  { label: "דת", query: "Religion" },
  { label: "שפה", query: "Language" },
  { label: "מדע", query: "Science" },
  { label: "תרבות", query: "Culture" },
  { label: "קהילות", query: "Communities" },
];

export default async function HebrewHomePage() {
  const published = await db
    .select({
      id: articles.id,
      slug: articles.slug,
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
    .orderBy(desc(articles.publishedAt));

  return (
    <main>
      {/* ---------------------------------------------------------- Hero */}
      <section className="border-b border-hairline bg-gradient-to-b from-card to-paper">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="eyebrow justify-center">
            <span className="h-px w-6 bg-brass" aria-hidden="true" />
            האנציקלופדיה המהימנה
            <span className="h-px w-6 bg-brass" aria-hidden="true" />
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.2] tracking-tight text-ink sm:text-5xl">
            אנציקלופדיה מתועדת של{" "}
            <span className="text-techelet">ישראל והעולם היהודי</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            סקירה מעמיקה ומבוססת מקורות של ההיסטוריה, התרבות, הדת, השפה,
            המדע והאנשים והקהילות שעיצבו אותם.
          </p>

          {/* Topic chips → search is in English, queries passed as-is */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TOPICS_HE.map((t) => (
              <Link
                key={t.label}
                href={`/search?q=${encodeURIComponent(t.query)}`}
                className="chip"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Articles */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <span className="eyebrow">מהספרייה</span>
            <h2 className="mt-1.5 font-display text-2xl font-bold text-ink">
              פורסם לאחרונה
            </h2>
          </div>
          <Link href="/" className="text-sm text-muted transition-colors hover:text-techelet">
            English version
          </Link>
        </div>

        {published.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {published.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/he/article/${a.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-hairline bg-card p-6 transition-all hover:border-techelet hover:shadow-[0_2px_20px_-8px_rgba(27,59,107,0.25)]"
                >
                  <h3 className="font-display text-xl font-bold leading-snug text-ink transition-colors group-hover:text-techelet">
                    {a.titleHe}
                  </h3>
                  {a.summaryHe && (
                    <p className="mt-2 line-clamp-3 flex-1 text-[0.95rem] leading-relaxed text-muted">
                      {a.summaryHe}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-azure">
                    קריאת המאמר
                    <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-hairline-strong bg-card/50 px-6 py-16 text-center">
            <p className="font-display text-xl text-ink">הספרייה בתהליך בנייה.</p>
            <p className="mt-2 text-muted">
              מאמרים בעברית יפורסמו בקרוב — כדאי לחזור מאוחר יותר.
            </p>
            <Link href="/" className="mt-6 inline-block text-sm text-azure hover:underline">
              לגרסה האנגלית
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
