import { NextResponse } from "next/server";
import { debugError, debugLog } from "@/lib/debug";
import { prisma } from "@/lib/db";
import { hashApiToken } from "@/lib/publishing";
import { decryptSecret } from "@/lib/secure-secret";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ apiPath: string }> }) {
  const { apiPath } = await params;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return jsonError("Missing bearer token.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const agent = await prisma.publishedAgent.findUnique({ where: { apiPath } });
  if (!agent || agent.status !== "ACTIVE" || !agent.tokenHash) {
    return jsonError("Agent endpoint not found or inactive.", 404);
  }
  if (hashApiToken(token) !== agent.tokenHash) {
    return jsonError("Invalid token.", 403);
  }

  const parameterValue = body[agent.apiParameterKey] ?? body.request;
  if (parameterValue == null || String(parameterValue).trim().length === 0) {
    return jsonError(`Missing required parameter "${agent.apiParameterKey}".`, 400);
  }

  const upstreamPayload = { [agent.apiParameterKey]: parameterValue };
  debugLog("agent-run", "authorized", {
    agentId: agent.id,
    apiPath,
    hostingMode: agent.hostingMode,
    apiParameterKey: agent.apiParameterKey,
    forwardsToUpstream: agent.hostingMode === "SELF_HOSTED",
    hasUpstreamToken: Boolean(agent.upstreamAuthTokenEnc),
  });

  if (agent.hostingMode === "SELF_HOSTED" && agent.endpointUrl) {
    try {
      const upstreamHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (agent.upstreamAuthTokenEnc) {
        upstreamHeaders.Authorization = `Bearer ${decryptSecret(agent.upstreamAuthTokenEnc)}`;
      }

      const upstreamResponse = await fetch(agent.endpointUrl, {
        method: "POST",
        headers: upstreamHeaders,
        body: JSON.stringify(upstreamPayload),
      });
      const responseText = await upstreamResponse.text();
      const upstreamBody = responseText ? tryParseJson(responseText) : null;

      if (!upstreamResponse.ok) {
        debugLog("agent-run", "upstream:failed", {
          agentId: agent.id,
          status: upstreamResponse.status,
        });
        return NextResponse.json(
          {
            ok: false,
            error: "Upstream agent API failed.",
            upstreamStatus: upstreamResponse.status,
            upstream: upstreamBody,
          },
          { status: 502 },
        );
      }

      await recordRun(agent.id, agent.priceSats);
      debugLog("agent-run", "upstream:ok", { agentId: agent.id, status: upstreamResponse.status });
      return NextResponse.json({
        ok: true,
        message: "Self-hosted agent API returned successfully.",
        upstream: upstreamBody,
      });
    } catch (error) {
      debugError("agent-run", "upstream:error", error, { agentId: agent.id });
      return jsonError("Could not reach upstream agent API.", 502);
    }
  }

  await recordRun(agent.id, agent.priceSats);

  return NextResponse.json({
    ok: true,
    message: "Authorized. Hosted agent run queued on marketplace infrastructure.",
    payload: upstreamPayload,
  });
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

async function recordRun(agentId: string, priceSats: number) {
  await prisma.publishedAgent.update({
    where: { id: agentId },
    data: {
      runCount: { increment: 1 },
      revenueSats: { increment: priceSats },
    },
  });
}
