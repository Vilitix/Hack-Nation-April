import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth-password";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth-session";
import { debugLog } from "@/lib/debug";
import { prisma } from "@/lib/db";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  debugLog("auth", "login:attempt", { email });

  if (!email || !password) {
    debugLog("auth", "login:rejected", { email, reason: "missing-credentials" });
    return jsonError("Email and password are required.", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    debugLog("auth", "login:rejected", { email, reason: "user-not-found" });
    return jsonError("Invalid email or password.", 401);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    debugLog("auth", "login:rejected", { email, userId: user.id, reason: "bad-password" });
    return jsonError("Invalid email or password.", 401);
  }

  const token = await createSessionToken({ userId: user.id, email: user.email });
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  debugLog("auth", "login:ok", { userId: user.id, email: user.email });
  return res;
}
