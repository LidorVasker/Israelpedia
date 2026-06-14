import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-hairline bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <span className="font-display text-xl font-bold">
            <span className="text-techelet">Israel</span>
            <span className="text-ink">Pedia</span>
          </span>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            A sourced reference to Israel and the Jewish world — history,
            culture, religion, language, science, and communities worldwide.
            Every article is written to be accurate, neutral, and properly
            cited.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
          <span className="eyebrow mb-1">Explore</span>
          <Link href="/" className="text-muted transition-colors hover:text-techelet">
            All articles
          </Link>
          <Link href="/?q=history" className="text-muted transition-colors hover:text-techelet">
            History
          </Link>
          <Link href="/?q=culture" className="text-muted transition-colors hover:text-techelet">
            Culture
          </Link>
          <Link href="/suggest" className="text-muted transition-colors hover:text-techelet">
            Suggest a topic
          </Link>
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          <span className="eyebrow mb-1">About</span>
          <p className="text-muted leading-relaxed">
            Articles are reviewed by human editors before publication. AI-drafted
            entries never publish without review.
          </p>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {year} IsraelPedia. All rights reserved.</span>
          <span>Built for readers, editors, and researchers.</span>
        </div>
      </div>
    </footer>
  );
}
