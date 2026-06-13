"use server";

import { db } from "@/db";
import { suggestions } from "@/db/schema";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type State = { success: true } | { success: false; error: string } | null;

export async function suggestArticle(_prev: State, formData: FormData): Promise<State> {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const topic = (formData.get("topic") as string)?.trim();
  const rationale = (formData.get("rationale") as string)?.trim() || null;

  if (!topic) return { success: false, error: "Topic is required." };

  const userId = (session.user as any).id as string;

  await db.insert(suggestions).values({ topic, rationale, suggestedBy: userId });

  return { success: true };
}
