import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth-password";
import { createSessionToken, getSession, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("You must be signed in.", 401);

  let body: { name?: unknown; email?: unknown; currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return jsonError("Account not found.", 404);

  const currentPassword = String(body.currentPassword ?? "");
  const nextEmail = body.email != null ? String(body.email).trim().toLowerCase() : undefined;
  const nextName = body.name != null ? String(body.name).trim() : undefined;
  const nextPassword = body.newPassword != null ? String(body.newPassword) : undefined;

  const changingEmail = nextEmail != null && nextEmail !== user.email;
  const changingPassword = nextPassword != null && nextPassword.length > 0;

  if (changingEmail || changingPassword) {
    const passwordOk = await verifyPassword(currentPassword, user.passwordHash);
    if (!passwordOk) return jsonError("Current password is incorrect.", 403);
  }

  if (nextEmail != null && !emailRe.test(nextEmail)) {
    return jsonError("Enter a valid email address.", 400);
  }
  if (changingPassword && nextPassword.length < 8) {
    return jsonError("New password must be at least 8 characters.", 400);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(nextName !== undefined ? { name: nextName || null } : {}),
        ...(changingEmail ? { email: nextEmail } : {}),
        ...(changingPassword ? { passwordHash: await hashPassword(nextPassword) } : {}),
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const res = NextResponse.json({ user: updated });
    if (changingEmail) {
      const token = await createSessionToken({ userId: updated.id, email: updated.email });
      res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
    }
    return res;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("This email is already in use.", 409);
    }
    throw error;
  }
}
