import { NextResponse } from "next/server";
import { debugLog } from "@/lib/debug";
import { semanticSearchAgents } from "@/lib/semantic-agent-search";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: { query?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const query = String(body.query ?? "").trim();
  if (query.length > 500) return jsonError("Search query is too long.", 400);

  debugLog("api:search", "request", { query, queryLength: query.length });
  const matches = await semanticSearchAgents(query);
  debugLog("api:search", "response", {
    matchCount: matches.length,
    matches: matches.map((match) => ({ id: match.agent.id, name: match.agent.name, score: match.score })),
  });
  return NextResponse.json({ matches });
}
