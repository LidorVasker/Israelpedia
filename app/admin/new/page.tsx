// app/admin/new/page.tsx
import { requireAdmin } from "@/lib/auth-guard";
import Link from "next/link";
import ArticleForm from "./article-form";

export default async function NewArticlePage() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <Link href="/admin" className="text-muted transition-colors hover:text-techelet">
          ← Back to articles
        </Link>
      </nav>
      <header className="mb-8">
        <span className="eyebrow">New entry</span>
        <h1 className="mt-1.5 font-display text-3xl font-bold text-ink">Create article</h1>
      </header>
      <ArticleForm />
    </main>
  );
}
