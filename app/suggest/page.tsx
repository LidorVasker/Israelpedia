import { requireUser } from "@/lib/auth-guard";
import Link from "next/link";
import SuggestForm from "./suggest-form";

export default async function SuggestPage() {
  await requireUser();

  return (
    <main style={{ padding: "2rem" }}>
      <Link href="/">← Back</Link>
      <h1 style={{ margin: "1rem 0 0.5rem" }}>Suggest an article</h1>
      <p style={{ marginBottom: "1.5rem", color: "#555" }}>
        Have a topic you&apos;d like to see covered? Submit it here and our
        editors will review it.
      </p>
      <SuggestForm />
    </main>
  );
}
