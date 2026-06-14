import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="rule-brass mb-6 w-16" />
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-ink">404</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        We couldn’t find that page. It may have been moved, archived, or never
        existed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Go to homepage
        </Link>
        <Link href="/?q=" className="btn btn-secondary">
          Search articles
        </Link>
      </div>
    </main>
  );
}
