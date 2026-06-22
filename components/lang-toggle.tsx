"use client";

import { usePathname, useRouter } from "next/navigation";

function isHe(path: string): boolean {
  return path === "/he" || path.startsWith("/he/");
}

// Only these English paths have a direct Hebrew equivalent.
// Everything else (admin, search, auth pages) falls back to /he.
function toHe(path: string): string {
  if (path === "/") return "/he";
  if (path.startsWith("/article/")) return `/he${path}`;
  return "/he";
}

function toEn(path: string): string {
  if (path === "/he" || path === "/he/") return "/";
  if (path.startsWith("/he/article/")) return path.slice(3);
  if (path.startsWith("/he/")) return "/";
  return path;
}

const COOKIE = "ip-lang";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export default function LangToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const hebrew = isHe(pathname);

  function pick(lang: "en" | "he") {
    document.cookie = `${COOKIE}=${lang}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    router.push(lang === "he" ? toHe(pathname) : toEn(pathname));
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-md px-1 py-1 text-sm"
    >
      <button
        type="button"
        onClick={() => pick("en")}
        disabled={!hebrew}
        aria-pressed={!hebrew}
        aria-label="Switch to English"
        className={`rounded px-1.5 py-0.5 font-semibold transition-colors ${
          !hebrew
            ? "text-techelet"
            : "text-muted hover:text-ink"
        }`}
      >
        EN
      </button>
      <span className="select-none text-hairline-strong" aria-hidden="true">·</span>
      <button
        type="button"
        onClick={() => pick("he")}
        disabled={hebrew}
        aria-pressed={hebrew}
        aria-label="עבור לעברית"
        className={`rounded px-1.5 py-0.5 font-semibold transition-colors ${
          hebrew
            ? "text-techelet"
            : "text-muted hover:text-ink"
        }`}
      >
        עברית
      </button>
    </div>
  );
}
