// Stateless session tokens (HS256 JWT). This module has no Next.js imports so
// it can be shared by the proxy, Server Components and Server Actions.
import { jwtVerify, SignJWT } from "jose";

export interface SessionPayload {
  sub: string;
}

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string, secret: string, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(key(secret));
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return payload.sub ? { sub: payload.sub } : null;
  } catch {
    return null;
  }
}
