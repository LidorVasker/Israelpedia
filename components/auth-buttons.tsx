// components/auth-buttons.tsx
import { auth, signIn, signOut } from "@/auth";

export default async function AuthButtons() {
  const session = await auth();

  if (session?.user) {
    const label = session.user.name ?? session.user.email ?? "Account";
    return (
      <div className="flex items-center gap-3">
        <span
          className="hidden lg:inline text-sm text-muted max-w-[14ch] truncate"
          title={label}
        >
          {label}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button type="submit" className="btn btn-secondary">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <button type="submit" className="btn btn-primary">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white">
          <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z" />
            <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z" />
            <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5C3 17 2.2 20.4 2.2 24s.8 7 2.3 9.9l7.3-5.7z" />
            <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
          </svg>
        </span>
        Sign in with Google
      </button>
    </form>
  );
}
