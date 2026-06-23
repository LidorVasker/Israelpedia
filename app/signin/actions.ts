"use server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

type State = { error: string } | null;

export async function signInWithCredentials(_prev: State, formData: FormData): Promise<State> {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";
  try {
    await signIn("credentials", {
      email: (formData.get("email") as string)?.trim().toLowerCase(),
      password: formData.get("password") as string,
      redirectTo: callbackUrl,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }
  return null;
}
