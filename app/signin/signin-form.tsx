"use client";
import { useActionState } from "react";
import { signInWithCredentials } from "./actions";
import Link from "next/link";

const inputStyle = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: "1rem",
  width: "100%",
};

export default function SignInForm({
  registered,
  reset,
  callbackUrl = "/",
}: {
  registered?: boolean;
  reset?: boolean;
  callbackUrl?: string;
}) {
  const [state, action, pending] = useActionState(signInWithCredentials, null);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {registered && (
        <p style={{ color: "green", margin: 0 }}>Account created! You can now sign in.</p>
      )}
      {reset && (
        <p style={{ color: "green", margin: 0 }}>Password updated. Sign in with your new password.</p>
      )}
      {state?.error && <p style={{ color: "red", margin: 0 }}>{state.error}</p>}

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Email
        <input name="email" type="email" required autoComplete="email" style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Password
        <input name="password" type="password" required autoComplete="current-password" style={inputStyle} />
      </label>

      <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
        <Link href="/forgot-password" style={{ fontSize: "0.85rem", color: "#0070f3" }}>
          Forgot your password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "0.6rem 1rem",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: "1rem",
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
