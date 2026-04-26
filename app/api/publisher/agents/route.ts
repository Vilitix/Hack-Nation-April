import { HostingMode, HostingPlan } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { apiSlug, generateApiToken, hashApiToken } from "@/lib/publishing";
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
  if (!session) return jsonError("You must be signed in.", 401);

  let body: {
    name?: unknown;
    description?: unknown;
    priceSats?: unknown;
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
  const mode = body.hostingMode === "MARKET_HOSTED" ? HostingMode.MARKET_HOSTED : HostingMode.SELF_HOSTED;
  const endpointUrl = body.endpointUrl != null ? String(body.endpointUrl).trim() : "";
  const port = Number(body.port);
  const hostingPlan = mode === HostingMode.MARKET_HOSTED ? parsePlan(body.hostingPlan) : null;

  if (name.length < 3) return jsonError("Agent name must be at least 3 characters.", 400);
  if (description.length < 10) return jsonError("Description must be at least 10 characters.", 400);
  if (!Number.isInteger(priceSats) || priceSats < 1) return jsonError("Price must be a positive number of sats.", 400);
  if (mode === HostingMode.SELF_HOSTED && !/^https:\/\/.+/i.test(endpointUrl)) {
    return jsonError("Self-hosted agents need a secure HTTPS endpoint.", 400);
  }
  if (mode === HostingMode.SELF_HOSTED && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    return jsonError("Enter a valid self-hosted port.", 400);
  }
  if (mode === HostingMode.MARKET_HOSTED && !hostingPlan) {
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
      port: mode === HostingMode.SELF_HOSTED ? port : null,
      apiPath,
      tokenHash: hashApiToken(apiToken),
      status: mode === HostingMode.SELF_HOSTED ? "ACTIVE" : "WAITING_PAYMENT",
    },
  });

  try {
    await indexPublishedAgent(agent);
  } catch (error) {
    await prisma.publishedAgent.delete({ where: { id: agent.id } });
    console.error("Failed to index published agent.", error);
    return jsonError("Agent was not published because semantic indexing failed. Check NVIDIA_API_KEY and Chroma.", 503);
  }

  return NextResponse.json({ agent, apiToken });
}
