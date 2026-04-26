import { HostingMode, HostingPlan } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { debugError, debugLog } from "@/lib/debug";
import { prisma } from "@/lib/db";
import { apiSlug, generateApiToken, hashApiToken } from "@/lib/publishing";
import { encryptSecret } from "@/lib/secure-secret";
import { indexPublishedAgent } from "@/lib/semantic-agent-search";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parsePlan(value: unknown): HostingPlan | null {
  if (typeof value !== "string") return null;
  return Object.values(HostingPlan).includes(value as HostingPlan) ? (value as HostingPlan) : null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    debugLog("publish", "create:rejected", { reason: "not-signed-in" });
    return jsonError("You must be signed in.", 401);
  }

  let body: {
    name?: unknown;
    description?: unknown;
    priceSats?: unknown;
    apiParameterKey?: unknown;
    apiParameterLabel?: unknown;
    apiParameterPlaceholder?: unknown;
    upstreamAuthToken?: unknown;
    hostingMode?: unknown;
    hostingPlan?: unknown;
    endpointUrl?: unknown;
    port?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const priceSats = Number(body.priceSats);
  const apiParameterKey = String(body.apiParameterKey ?? "request").trim();
  const apiParameterLabel = String(body.apiParameterLabel ?? "Request").trim();
  const apiParameterPlaceholder = String(body.apiParameterPlaceholder ?? "").trim();
  const upstreamAuthToken = body.upstreamAuthToken != null ? String(body.upstreamAuthToken).trim() : "";
  const mode = body.hostingMode === "MARKET_HOSTED" ? HostingMode.MARKET_HOSTED : HostingMode.SELF_HOSTED;
  const endpointUrl = body.endpointUrl != null ? String(body.endpointUrl).trim() : "";
  const port = Number(body.port);
  const hostingPlan = mode === HostingMode.MARKET_HOSTED ? parsePlan(body.hostingPlan) : null;
  debugLog("publish", "create:attempt", {
    userId: session.userId,
    name,
    descriptionLength: description.length,
    priceSats,
    apiParameterKey,
    hasUpstreamToken: Boolean(upstreamAuthToken),
    mode,
    hostingPlan,
  });

  if (name.length < 3) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "short-name" });
    return jsonError("Agent name must be at least 3 characters.", 400);
  }
  if (description.length < 10) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "short-description" });
    return jsonError("Description must be at least 10 characters.", 400);
  }
  if (!Number.isInteger(priceSats) || priceSats < 1) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "bad-price", priceSats });
    return jsonError("Price must be a positive number of sats.", 400);
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]{1,31}$/.test(apiParameterKey)) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "bad-parameter-key", apiParameterKey });
    return jsonError("Parameter key must start with a letter and use 2-32 letters, numbers, or underscores.", 400);
  }
  if (apiParameterLabel.length < 2 || apiParameterLabel.length > 80) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "bad-parameter-label" });
    return jsonError("Parameter label must be between 2 and 80 characters.", 400);
  }
  if (mode === HostingMode.SELF_HOSTED && !/^https:\/\/.+/i.test(endpointUrl)) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "bad-endpoint" });
    return jsonError("Self-hosted agents need a secure HTTPS endpoint.", 400);
  }
  if (mode === HostingMode.SELF_HOSTED && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "bad-port", port });
    return jsonError("Enter a valid self-hosted port.", 400);
  }
  if (mode === HostingMode.MARKET_HOSTED && !hostingPlan) {
    debugLog("publish", "create:rejected", { userId: session.userId, reason: "missing-plan" });
    return jsonError("Choose a hosting plan.", 400);
  }

  const apiToken = generateApiToken();
  const apiPath = apiSlug(name);
  const agent = await prisma.publishedAgent.create({
    data: {
      ownerId: session.userId,
      name,
      description,
      priceSats,
      hostingMode: mode,
      hostingPlan,
      endpointUrl: mode === HostingMode.SELF_HOSTED ? endpointUrl : null,
      apiParameterKey,
      apiParameterLabel,
      apiParameterPlaceholder: apiParameterPlaceholder || null,
      upstreamAuthTokenEnc: mode === HostingMode.SELF_HOSTED && upstreamAuthToken ? encryptSecret(upstreamAuthToken) : null,
      port: mode === HostingMode.SELF_HOSTED ? port : null,
      apiPath,
      tokenHash: hashApiToken(apiToken),
      status: mode === HostingMode.SELF_HOSTED ? "ACTIVE" : "WAITING_PAYMENT",
    },
  });
  debugLog("publish", "create:db-created", {
    agentId: agent.id,
    apiPath: agent.apiPath,
    status: agent.status,
    mode: agent.hostingMode,
  });

  try {
    await indexPublishedAgent(agent);
  } catch (error) {
    await prisma.publishedAgent.delete({ where: { id: agent.id } });
    debugError("publish", "create:index-failed-rolled-back", error, { agentId: agent.id });
    return jsonError("Agent was not published because semantic indexing failed. Check NVIDIA_API_KEY and Chroma.", 503);
  }

  debugLog("publish", "create:ok", { agentId: agent.id, name: agent.name, status: agent.status });
  return NextResponse.json({ agent, apiToken });
}
