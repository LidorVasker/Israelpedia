"use server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

type State = { error: string } | null;

export async function resetPassword(_prev: State, formData: FormData): Promise<State> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!token) return { error: "Missing reset token." };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, new Date())));

  if (!record) return { error: "This reset link is invalid or has expired." };

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.transaction(async (tx) => {
    await tx.update(users).set({ hashedPassword }).where(eq(users.id, record.userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));
  });

  redirect("/signin?reset=true");
}
