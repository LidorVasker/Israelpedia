// app/admin/new/page.tsx
import { requireAdmin } from "@/lib/auth-guard";
import ArticleForm from "./article-form";

export default async function NewArticlePage() {
  await requireAdmin();
  return (
    <main style={{ padding: "2rem" }}>
      <h1>New Article</h1>
      <ArticleForm />
    </main>
  );
}