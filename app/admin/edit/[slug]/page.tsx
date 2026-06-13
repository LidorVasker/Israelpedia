import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/db";
import { articles, articleReferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ArticleEditForm from "./article-edit-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
  if (!article) notFound();

  const refs = await db
    .select()
    .from(articleReferences)
    .where(eq(articleReferences.articleId, article.id));

  const initialRefs = refs.map((r) => ({
    url: r.url ?? "",
    title: r.title ?? "",
    source: r.sourceName ?? "",
  }));

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Edit: {article.title}</h1>
      <ArticleEditForm
        article={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary ?? "",
          body: article.body,
          status: article.status,
        }}
        initialRefs={initialRefs}
      />
    </main>
  );
}
