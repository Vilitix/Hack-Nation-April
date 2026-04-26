import { NextResponse } from "next/server";
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

  const matches = await semanticSearchAgents(query);
  return NextResponse.json({ matches });
}
