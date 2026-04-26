import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth-password";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");
  const nameRaw = body.name != null ? String(body.name).trim() : "";
  const name = nameRaw.length > 0 ? nameRaw : null;

  if (!email || !emailRe.test(email)) {
    return jsonError("Enter a valid email address.", 400);
  }
  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = await createSessionToken({ userId: user.id, email: user.email });
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return res;
}
