import { z } from "zod";
import { MAX_LOAN_DAYS } from "./types";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email").trim().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim(),
  password: z.string().min(1, "Password is required"),
});

const tagList = z.array(z.string().trim().min(1).max(50)).max(20);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().min(1, "Author is required").max(200),
  description: z.string().trim().max(5000).default(""),
  isbn: optionalText(32),
  authorId: z.uuid().nullable(),
  tags: tagList,
  // undefined = leave the cover untouched (updates only); null = remove it.
  coverKey: z.string().max(512).nullable().optional(),
});

export const authorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  bio: z.string().trim().max(5000).default(""),
  tags: tagList,
  pictureKey: z.string().max(512).nullable().optional(),
});

export const memberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  nationalId: z.string().trim().min(1, "National ID is required").max(50),
  email: z.email("Enter a valid email").trim().max(200),
  phone: z.string().trim().max(50).default(""),
});

export const loanDaysSchema = z.coerce.number().int().min(1).max(MAX_LOAN_DAYS);

export const lendSchema = z.object({
  bookId: z.uuid(),
  memberId: z.uuid("Pick a member"),
  days: loanDaysSchema,
});

export const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(256),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

/** First human-readable message of a failed parse, for the form's error banner. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
