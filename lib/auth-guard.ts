// lib/auth-guard.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function getSession() {
  try {
    return await auth();
  } catch {
    // JWTSessionError / JWEInvalid — treat as unauthenticated
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  const role = (session?.user as any)?.role;
  if (!session?.user) redirect("/api/auth/signin");
  if (role !== "admin") redirect("/");
  return session;
}

export async function requireUser(callbackUrl?: string) {
  const session = await getSession();
  if (!session?.user) {
    redirect(
      callbackUrl
        ? `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/api/auth/signin"
    );
  }
  return session;
}
