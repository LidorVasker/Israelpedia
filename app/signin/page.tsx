import { signIn } from "@/auth";
import Link from "next/link";
import SignInForm from "./signin-form";

const googleSvg = (
  <span
    style={{
      display: "inline-flex",
      height: 16,
      width: 16,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      background: "#fff",
      marginRight: "0.5rem",
    }}
  >
    <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5C3 17 2.2 20.4 2.2 24s.8 7 2.3 9.9l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
    </svg>
  </span>
);

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; reset?: string; callbackUrl?: string }>;
}) {
  const { registered, reset, callbackUrl } = await searchParams;
  const redirectTo = callbackUrl || "/";

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
        <h1 style={{ marginBottom: "0.25rem" }}>Sign in</h1>
        <p style={{ color: "#555", marginBottom: "2rem" }}>
          Welcome back to IsraelPedia.
        </p>

        <SignInForm registered={registered === "true"} reset={reset === "true"} callbackUrl={redirectTo} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "1.5rem 0",
          }}
        >
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #eee" }} />
          <span style={{ color: "#aaa", fontSize: "0.85rem" }}>or</span>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #eee" }} />
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "0.6rem 1rem",
              background: "#fff",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {googleSvg}
            Sign in with Google
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", color: "#555", fontSize: "0.9rem" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#0070f3" }}>
            Create one
          </Link>
        </p>
        <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <Link href="/" style={{ color: "#aaa", fontSize: "0.85rem" }}>
            ← Back to IsraelPedia
          </Link>
        </p>
      </div>
    </main>
  );
}
