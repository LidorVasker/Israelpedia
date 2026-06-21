"use server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { redirect } from "next/navigation";

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) redirect("/forgot-password?sent=true");

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Reset your IsraelPedia password",
      html: `<p>Click the link below to reset your IsraelPedia password. This link expires in 1 hour.</p>
<p><a href="https://israelpedia.vercel.app/reset-password?token=${token}">Reset my password</a></p>
<p>If you didn't request this, you can ignore this email.</p>`,
    });
  }

  redirect("/forgot-password?sent=true");
}
