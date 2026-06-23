import Link from "next/link";

/**
 * "Suggest an article" entry point, shown to everyone.
 * - Signed in  → links straight to the suggest form.
 * - Signed out → links to /signin with callbackUrl=/suggest.
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

  return (
    <Link
      href={isLoggedIn ? "/suggest" : "/signin?callbackUrl=%2Fsuggest"}
      className={className}
    >
      Suggest an article
    </Link>
  );
}
