import { db } from "@/db";
import { articles } from "@/db/schema";
import { and, eq, not, isNull, desc } from "drizzle-orm";
import Link from "next/link";
import ArticleGrid from "@/components/article-grid";
import { fetchMoreHebrewArticles } from "@/app/actions/articles";

const TOPICS_HE = [
  { label: "אנשים", query: "People" },
  { label: "היסטוריה", query: "History" },
  { label: "דת", query: "Religion" },
  { label: "שפה", query: "Language" },
  { label: "מדע", query: "Science" },
  { label: "תרבות", query: "Culture" },
  { label: "קהילות", query: "Communities" },
];

const INITIAL_SIZE = 20;

export default async function HebrewHomePage() {
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
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
    .orderBy(desc(articles.publishedAt))
    .limit(INITIAL_SIZE + 1);

  const initialArticles = rows.slice(0, INITIAL_SIZE);
  const initialHasMore = rows.length > INITIAL_SIZE;

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

          {/* Search bar */}
          <form action="/he/search" method="get" role="search" className="relative mx-auto mt-8 max-w-lg">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="חיפוש בישראלפדיה..."
              aria-label="חיפוש מאמרים"
              className="input w-full !pl-9"
            />
          </form>

          {/* Topic chips */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TOPICS_HE.map((t) => (
              <Link
                key={t.label}
                href={`/he/search?q=${encodeURIComponent(t.query)}`}
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

        {initialArticles.length > 0 ? (
          <ArticleGrid
            initialArticles={initialArticles}
            initialHasMore={initialHasMore}
            lang="he"
            fetchMore={fetchMoreHebrewArticles}
          />
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
