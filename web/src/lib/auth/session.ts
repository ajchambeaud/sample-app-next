import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { signSessionToken, verifySessionToken } from "./token";

export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId, env.session.secret, env.session.maxAgeSeconds);
  (await cookies()).set(env.session.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.session.secure,
    path: "/",
    maxAge: env.session.maxAgeSeconds,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(env.session.cookieName);
}

/** Reads and verifies the session cookie. Returns the user id or null. */
export async function readSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(env.session.cookieName)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token, env.session.secret);
  return payload?.sub ?? null;
}
