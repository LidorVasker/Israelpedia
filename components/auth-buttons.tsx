// components/auth-buttons.tsx
import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";

export default async function AuthButtons() {
  const session = await auth();

  if (session?.user) {
    const isAdmin = (session.user as any).role === "admin";
    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <span>Signed in as {session.user.name ?? session.user.email}</span>
        {isAdmin && <Link href="/admin">Admin Dashboard</Link>}
        <Link href="/suggest">Suggest an article</Link>
        <form action={async () => { "use server"; await signOut(); }}>
          <button type="submit">Sign out</button>
        </form>
      </div>
    );
  }

  return (
    <form action={async () => { "use server"; await signIn("google"); }}>
      <button type="submit">Sign in with Google</button>
    </form>
  );
}