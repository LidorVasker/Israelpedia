import { requireUser } from "@/lib/auth-guard";
import Link from "next/link";
import SuggestForm from "./suggest-form";

export const metadata = { title: "Suggest a topic" };

export default async function SuggestPage() {
  await requireUser("/suggest");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="mb-8 text-sm" aria-label="Breadcrumb">
        <Link href="/" className="text-muted transition-colors hover:text-techelet">
          ← Back to articles
        </Link>
      </nav>

      <div className="rule-brass mb-6 w-16" />
      <p className="eyebrow">Help shape the library</p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-ink">
        Suggest a topic
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Is something missing? Tell us what you’d like to see covered. Our editors
        review every suggestion and research accepted topics with real sources
        before publishing.
      </p>

      <div className="card mt-8 p-6 sm:p-8">
        <SuggestForm />
      </div>
    </main>
  );
}
