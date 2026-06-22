import { cookies } from "next/headers";
import { auth } from "@/auth";
import HeaderShell from "./header-shell";
import AuthButtons from "./auth-buttons";
import SuggestLink from "./suggest-link";

export default async function SiteHeader() {
  // cookies() never throws; auth() can throw JWTSessionError on an invalid/expired
  // token, which we treat as "not signed in" rather than crashing the page.
  const cookieStore = await cookies();
  let session = null;
  try {
    session = await auth();
  } catch {}

  const isLoggedIn = !!session?.user;
  const isAdmin = (session?.user as any)?.role === "admin";
  const homePath = cookieStore.get("ip-lang")?.value === "he" ? "/he" : "/";

  return (
    <HeaderShell
      isAdmin={isAdmin}
      homePath={homePath}
      authSlot={<AuthButtons />}
      suggestDesktop={<SuggestLink isLoggedIn={isLoggedIn} variant="desktop" />}
      suggestMobile={<SuggestLink isLoggedIn={isLoggedIn} variant="mobile" />}
    />
  );
}
