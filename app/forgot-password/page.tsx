import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  if (sent === "true") {
    return (
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "0.5rem" }}>Check your email</h1>
        <p style={{ color: "#555", maxWidth: 400, lineHeight: 1.6 }}>
          If that email is registered, you&apos;ll receive a reset link shortly. Check your
          spam folder if you don&apos;t see it within a few minutes.
        </p>
        <Link href="/signin" style={{ marginTop: "2rem", color: "#0070f3" }}>
          ← Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ marginBottom: "0.25rem" }}>Reset your password</h1>
        <p style={{ color: "#555", marginBottom: "2rem" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form action={requestPasswordReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                padding: "0.5rem 0.75rem",
                border: "1px solid #ccc",
                borderRadius: 6,
                fontSize: "1rem",
                width: "100%",
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              padding: "0.6rem 1rem",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Send reset link
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link href="/signin" style={{ color: "#aaa", fontSize: "0.85rem" }}>
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
