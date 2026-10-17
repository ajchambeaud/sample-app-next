export type SearchParams = Record<string, string | string[] | undefined>;

export function getString(sp: SearchParams, key: string): string {
  const value = sp[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getPage(sp: SearchParams): number {
  return Math.max(1, Number(getString(sp, "page")) || 1);
}

export function getBoolean(sp: SearchParams, key: string): boolean {
  return getString(sp, key) === "true";
}

/** Rebuilds URLSearchParams from the parsed record (first value only). */
export function toURLSearchParams(sp: SearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) out.set(key, v);
  }
  return out;
}

/** Same query without the given keys, as a path with query string. */
export function hrefWithout(pathname: string, sp: SearchParams, ...keys: string[]): string {
  const params = toURLSearchParams(sp);
  for (const k of keys) params.delete(k);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
