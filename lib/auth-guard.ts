// lib/auth-guard.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user) {
    redirect("/api/auth/signin"); // not logged in → send to login
  }
  if (role !== "admin") {
    redirect("/"); // logged in but not admin → bounce home
  }
  return session;
}

export async function requireUser(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(
      callbackUrl
        ? `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/api/auth/signin"
    );
  }
  return session;
}