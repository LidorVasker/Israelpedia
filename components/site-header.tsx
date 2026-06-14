import { auth } from "@/auth";
import HeaderShell from "./header-shell";
import AuthButtons from "./auth-buttons";
import SuggestLink from "./suggest-link";

export default async function SiteHeader() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <HeaderShell
      isAdmin={isAdmin}
      authSlot={<AuthButtons />}
      suggestDesktop={<SuggestLink isLoggedIn={isLoggedIn} variant="desktop" />}
      suggestMobile={<SuggestLink isLoggedIn={isLoggedIn} variant="mobile" />}
    />
  );
}
