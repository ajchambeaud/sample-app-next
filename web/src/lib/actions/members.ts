"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/dal";
import { countActiveLoansForMember } from "@/lib/data/loans";
import { getDb, schema } from "@/lib/db";
import type { ActionState } from "@/lib/types";
import { firstIssue, memberSchema } from "@/lib/validation";
import { field, isUniqueViolation } from "./form";

const DUPLICATE = "A member with that national id or email already exists";

function parseMemberForm(formData: FormData) {
  return memberSchema.safeParse({
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    nationalId: field(formData, "nationalId"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
  });
}

export async function createMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessionUser())) return { error: "You must be signed in" };
  const parsed = parseMemberForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  let id: string;
  try {
    [{ id }] = await getDb().insert(schema.members).values(parsed.data).returning({ id: schema.members.id });
  } catch (err) {
    if (isUniqueViolation(err)) return { error: DUPLICATE };
    throw err;
  }
  revalidatePath("/members");
  redirect(`/members/${id}`);
}

export async function updateMember(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessionUser())) return { error: "You must be signed in" };
  const parsed = parseMemberForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  try {
    const updated = await getDb()
      .update(schema.members)
      .set(parsed.data)
      .where(eq(schema.members.id, id))
      .returning({ id: schema.members.id });
    if (updated.length === 0) return { error: "Member not found" };
  } catch (err) {
    if (isUniqueViolation(err)) return { error: DUPLICATE };
    throw err;
  }
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  revalidatePath("/loans");
  redirect(`/members/${id}`);
}

export async function deleteMember(id: string): Promise<ActionState> {
  if (!(await getSessionUser())) return { error: "You must be signed in" };
  if ((await countActiveLoansForMember(id)) > 0) return { error: "Cannot delete a member with books on loan" };

  const deleted = await getDb().delete(schema.members).where(eq(schema.members.id, id)).returning({ id: schema.members.id });
  if (deleted.length === 0) return { error: "Member not found" };

  revalidatePath("/members");
  revalidatePath("/loans");
  redirect("/members");
}
