"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb, schema } from "@/lib/db";
import type { ActionState } from "@/lib/types";
import { firstIssue, loginSchema, signupSchema } from "@/lib/validation";
import { field, safeNextPath } from "./form";

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email"),
    password: field(formData, "password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const db = getDb();
  const email = parsed.data.email.toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email), columns: { id: true } });
  if (existing) return { error: "That email is already registered" };

  const [user] = await db
    .insert(schema.users)
    .values({ email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) })
    .returning({ id: schema.users.id });

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(safeNextPath(field(formData, "next")));
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: field(formData, "email"), password: field(formData, "password") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.email, parsed.data.email.toLowerCase()),
    columns: { id: true, passwordHash: true },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(safeNextPath(field(formData, "next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
