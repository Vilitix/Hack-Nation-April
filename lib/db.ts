import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  // Keep local dev working even if `.env` was not created yet.
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
