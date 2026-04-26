import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new Error("AUTH_SECRET is not set. Add it to your .env file (e.g. openssl rand -base64 32).");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = { userId: string; email: string };

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ sub: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return session;
}
