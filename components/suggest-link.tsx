import { signIn } from "@/auth";
import Link from "next/link";

/**
 * "Suggest an article" entry point, shown to everyone.
 * - Signed in  → links straight to the suggest form.
 * - Signed out → starts Google sign-in and returns the user to /suggest.
 */
export default function SuggestLink({
  isLoggedIn,
  variant,
}: {
  isLoggedIn: boolean;
  variant: "desktop" | "mobile";
}) {
  const className =
    variant === "desktop"
      ? "btn-ghost rounded-md"
      : "w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-hairline/40";

  if (isLoggedIn) {
    return (
      <Link href="/suggest" className={className}>
        Suggest an article
      </Link>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/suggest" });
      }}
    >
      <button type="submit" className={className}>
        Suggest an article
      </button>
    </form>
  );
}
