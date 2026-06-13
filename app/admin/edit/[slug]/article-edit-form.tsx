"use client";

import { useState } from "react";
import { updateArticle } from "../../actions";

type Ref = { url: string; title: string; source: string };

type Props = {
  article: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    status: string;
  };
  initialRefs: Ref[];
};

export default function ArticleEditForm({ article, initialRefs }: Props) {
  const [refs, setRefs] = useState<Ref[]>(
    initialRefs.length > 0 ? initialRefs : [{ url: "", title: "", source: "" }]
  );

  const addRef    = () => setRefs([...refs, { url: "", title: "", source: "" }]);
  const removeRef = (i: number) => setRefs(refs.filter((_, idx) => idx !== i));

  return (
    <form action={updateArticle} style={{ display: "grid", gap: "1rem", maxWidth: 700 }}>
      <input type="hidden" name="articleId"   value={article.id} />
      <input type="hidden" name="articleSlug" value={article.slug} />

      <label>
        Title
        <input name="title" required defaultValue={article.title}
          style={{ display: "block", width: "100%", padding: "0.5rem" }} />
      </label>

      <label>
        Summary
        <textarea name="summary" rows={2} defaultValue={article.summary}
          style={{ display: "block", width: "100%", padding: "0.5rem" }} />
      </label>

      <label>
        Body (markdown)
        <textarea name="body" rows={14} required defaultValue={article.body}
          style={{ display: "block", width: "100%", padding: "0.5rem", fontFamily: "monospace" }} />
      </label>

      <label>
        Status
        <select name="status" defaultValue={article.status}
          style={{ display: "block", padding: "0.5rem" }}>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
        </select>
      </label>

      <label>
        Editor note{" "}
        <span style={{ color: "#888" }}>(optional — describes what changed)</span>
        <textarea name="editorNote" rows={2}
          style={{ display: "block", width: "100%", padding: "0.5rem" }} />
      </label>

      <fieldset style={{ border: "1px solid #ccc", padding: "1rem" }}>
        <legend>References</legend>
        {refs.map((ref, i) => (
          <div key={i} style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem",
                                paddingBottom: "1rem", borderBottom: "1px solid #eee" }}>
            <input name="ref_title" placeholder="Reference title" defaultValue={ref.title}
              style={{ padding: "0.4rem" }} />
            <input name="ref_url" placeholder="https://..." defaultValue={ref.url}
              style={{ padding: "0.4rem" }} />
            <input name="ref_source" placeholder="Source / publisher" defaultValue={ref.source}
              style={{ padding: "0.4rem" }} />
            {refs.length > 1 && (
              <button type="button" onClick={() => removeRef(i)} style={{ justifySelf: "start" }}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addRef}>+ Add reference</button>
      </fieldset>

      <button type="submit" style={{ padding: "0.6rem 1.2rem", fontWeight: "bold" }}>
        Save changes
      </button>
    </form>
  );
}
