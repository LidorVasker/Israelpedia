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

  const addRef = () => setRefs([...refs, { url: "", title: "", source: "" }]);
  const removeRef = (i: number) => setRefs(refs.filter((_, idx) => idx !== i));

  return (
    <form action={updateArticle} className="flex flex-col gap-6">
      <input type="hidden" name="articleId" value={article.id} />
      <input type="hidden" name="articleSlug" value={article.slug} />

      <div>
        <label htmlFor="title" className="field-label">Title</label>
        <input id="title" name="title" required defaultValue={article.title} className="input" />
      </div>

      <div>
        <label htmlFor="summary" className="field-label">
          Summary <span className="field-hint">(the lede shown under the title)</span>
        </label>
        <textarea id="summary" name="summary" rows={2} defaultValue={article.summary} className="textarea" />
      </div>

      <div>
        <label htmlFor="body" className="field-label">
          Body <span className="field-hint">(Markdown — headings, lists, links, tables)</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={16}
          required
          defaultValue={article.body}
          className="textarea font-mono text-sm"
        />
      </div>

      <div>
        <label htmlFor="status" className="field-label">Status</label>
        <select id="status" name="status" defaultValue={article.status} className="select max-w-xs">
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div>
        <label htmlFor="editorNote" className="field-label">
          Editor note <span className="field-hint">(optional — describes what changed)</span>
        </label>
        <textarea id="editorNote" name="editorNote" rows={2} className="textarea" />
      </div>

      <fieldset className="card p-5">
        <legend className="px-2 font-display text-lg font-bold text-ink">References</legend>
        <p className="mb-4 text-sm text-muted">
          Saving replaces all references with the list below. Each needs at least a title or URL.
        </p>
        <div className="flex flex-col gap-4">
          {refs.map((ref, i) => (
            <div key={i} className="rounded-lg border border-hairline bg-paper/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">Source {i + 1}</span>
                {refs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRef(i)}
                    className="text-sm font-medium text-[#b3261e] hover:opacity-75"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input name="ref_title" placeholder="Reference title" defaultValue={ref.title} className="input" />
                <input name="ref_url" placeholder="https://…" defaultValue={ref.url} className="input" />
                <input name="ref_source" placeholder="Source / publisher" defaultValue={ref.source} className="input" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRef} className="btn btn-secondary mt-4">
          + Add reference
        </button>
      </fieldset>

      <div>
        <button type="submit" className="btn btn-primary">Save changes</button>
      </div>
    </form>
  );
}
