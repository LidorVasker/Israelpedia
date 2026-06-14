"use client";

import { setArticleStatus } from "./actions";

const OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const COLOR: Record<string, string> = {
  published: "text-techelet",
  review: "text-brass",
  draft: "text-muted",
  archived: "text-[#b3261e]",
};

export default function StatusControl({
  articleId,
  status,
}: {
  articleId: string;
  status: string;
}) {
  return (
    <form action={setArticleStatus} className="inline-flex">
      <input type="hidden" name="articleId" value={articleId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Change article status"
        className={`cursor-pointer rounded-md border border-hairline-strong bg-card py-1 pl-2.5 pr-7 text-xs font-semibold capitalize transition-colors hover:border-techelet focus:outline-none focus:ring-2 focus:ring-azure ${
          COLOR[status] ?? "text-muted"
        }`}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
