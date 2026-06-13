"use client";

import { useActionState } from "react";
import { suggestArticle } from "./actions";

export default function SuggestForm() {
  const [state, action, pending] = useActionState(suggestArticle, null);

  if (state?.success) {
    return (
      <p style={{ color: "green" }}>
        Thanks — your suggestion has been submitted for review.
      </p>
    );
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 480 }}>
      {state && !state.success && (
        <p style={{ color: "red" }}>{state.error}</p>
      )}
      <label>
        Topic <span style={{ color: "red" }}>*</span>
        <input
          name="topic"
          type="text"
          required
          placeholder="e.g. Golda Meir"
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <label>
        Why should we cover this?{" "}
        <span style={{ color: "#888" }}>(optional)</span>
        <textarea
          name="rationale"
          rows={4}
          placeholder="Briefly explain why this topic matters."
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        style={{ padding: "0.5rem 1rem", cursor: pending ? "not-allowed" : "pointer" }}
      >
        {pending ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  );
}
