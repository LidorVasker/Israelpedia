"use server";

import { db } from "@/db";
import { articles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export async function archiveArticle(id: string, _formData: FormData) {
  await requireAdmin();
  await db.update(articles).set({ status: "archived" }).where(eq(articles.id, id));
  redirect("/");
}
