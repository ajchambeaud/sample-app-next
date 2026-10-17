export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString();
}

export function memberName(member: { firstName: string; lastName: string } | null): string {
  return member ? `${member.firstName} ${member.lastName}` : "Unknown member";
}

/** Joins class names, skipping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const DAY_MS = 24 * 60 * 60 * 1000;
