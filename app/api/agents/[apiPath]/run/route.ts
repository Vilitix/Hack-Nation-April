import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashApiToken } from "@/lib/publishing";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ apiPath: string }> }) {
  const { apiPath } = await params;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return jsonError("Missing bearer token.", 401);

  const agent = await prisma.publishedAgent.findUnique({ where: { apiPath } });
  if (!agent || agent.status !== "ACTIVE" || !agent.tokenHash) {
    return jsonError("Agent endpoint not found or inactive.", 404);
  }
  if (hashApiToken(token) !== agent.tokenHash) {
    return jsonError("Invalid token.", 403);
  }

  await prisma.publishedAgent.update({
    where: { id: agent.id },
    data: {
      runCount: { increment: 1 },
      revenueSats: { increment: agent.priceSats },
    },
  });

  return NextResponse.json({
    ok: true,
    message:
      agent.hostingMode === "SELF_HOSTED"
        ? "Authorized. Forward this payload to your self-hosted HTTPS endpoint."
        : "Authorized. Hosted agent run queued on marketplace infrastructure.",
    upstream: agent.hostingMode === "SELF_HOSTED" ? agent.endpointUrl : null,
  });
}
