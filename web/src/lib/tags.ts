/**
 * Turn a human display text into a URL/search-safe slug.
 * "Mi Tag" -> "mi-tag", "Ciencia-Ficción!" -> "ciencia-ficcion".
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
