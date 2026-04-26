import { HostingMode } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await getSession();
  if (!session) return jsonError("You must be signed in.", 401);

  const { agentId } = await params;
  let body: { paymentHash?: unknown; preimage?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  if (typeof body.paymentHash !== "string" || typeof body.preimage !== "string") {
    return jsonError("Missing payment proof.", 400);
  }

  const agent = await prisma.publishedAgent.findFirst({
    where: { id: agentId, ownerId: session.userId },
  });
  if (!agent) return jsonError("Agent not found.", 404);
  if (agent.hostingMode !== HostingMode.MARKET_HOSTED) {
    return jsonError("Only marketplace-hosted plans require activation payment.", 400);
  }

  const updated = await prisma.publishedAgent.update({
    where: { id: agent.id },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ agent: updated });
}
