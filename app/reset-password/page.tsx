import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";

const expiredView = (
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
    <h1 style={{ marginBottom: "0.5rem" }}>Link expired or invalid</h1>
    <p style={{ color: "#555", maxWidth: 380 }}>
      This password reset link has expired or is invalid. Reset links are valid for 1 hour.
    </p>
    <Link href="/forgot-password" style={{ marginTop: "2rem", color: "#0070f3" }}>
      Request a new reset link
    </Link>
  </main>
);

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) return expiredView;

  const [record] = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, new Date())));

  if (!record) return expiredView;

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
        <h1 style={{ marginBottom: "0.25rem" }}>Set a new password</h1>
        <p style={{ color: "#555", marginBottom: "2rem" }}>
          Choose a strong password for your account.
        </p>
        <ResetPasswordForm token={token} />
        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link href="/signin" style={{ color: "#aaa", fontSize: "0.85rem" }}>
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
