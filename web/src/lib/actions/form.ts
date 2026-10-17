// Small FormData helpers shared by the Server Actions (not a 'use server' module).

export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function optional(formData: FormData, name: string): string | null {
  const value = field(formData, name).trim();
  return value === "" ? null : value;
}

export function list(formData: FormData, name: string): string[] {
  return formData.getAll(name).filter((v): v is string => typeof v === "string");
}

/**
 * Image key semantics for create/update forms:
 *  - `clear` flag set  -> null (remove the current image)
 *  - a non-empty key   -> that key (new upload)
 *  - otherwise         -> undefined (leave untouched)
 */
export function imageKey(formData: FormData, keyName: string, clearName: string): string | null | undefined {
  if (field(formData, clearName) === "1") return null;
  const key = field(formData, keyName).trim();
  return key ? key : undefined;
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
