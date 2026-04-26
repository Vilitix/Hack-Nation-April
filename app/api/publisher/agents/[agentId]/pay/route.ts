import { HostingMode } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { debugError, debugLog } from "@/lib/debug";
import { prisma } from "@/lib/db";
import { indexPublishedAgent } from "@/lib/semantic-agent-search";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const session = await getSession();
  if (!session) {
    debugLog("publish", "activate:rejected", { reason: "not-signed-in" });
    return jsonError("You must be signed in.", 401);
  }

  const { agentId } = await params;
  debugLog("publish", "activate:attempt", { agentId, userId: session.userId });
  let body: { paymentHash?: unknown; preimage?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  if (typeof body.paymentHash !== "string" || typeof body.preimage !== "string") {
    debugLog("publish", "activate:rejected", { agentId, userId: session.userId, reason: "missing-payment-proof" });
    return jsonError("Missing payment proof.", 400);
  }

  const agent = await prisma.publishedAgent.findFirst({
    where: { id: agentId, ownerId: session.userId },
  });
  if (!agent) {
    debugLog("publish", "activate:rejected", { agentId, userId: session.userId, reason: "agent-not-found" });
    return jsonError("Agent not found.", 404);
  }
  if (agent.hostingMode !== HostingMode.MARKET_HOSTED) {
    debugLog("publish", "activate:rejected", { agentId, userId: session.userId, reason: "not-market-hosted" });
    return jsonError("Only marketplace-hosted plans require activation payment.", 400);
  }

  const updated = await prisma.publishedAgent.update({
    where: { id: agent.id },
    data: { status: "ACTIVE" },
  });
  debugLog("publish", "activate:db-updated", { agentId: updated.id, status: updated.status });

  try {
    await indexPublishedAgent(updated);
  } catch (error) {
    debugError("publish", "activate:index-refresh-failed", error, { agentId: updated.id });
  }

  debugLog("publish", "activate:ok", { agentId: updated.id, status: updated.status });
  return NextResponse.json({ agent: updated });
}
