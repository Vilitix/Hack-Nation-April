import { ChromaClient } from "chromadb";
import { agents as seededAgents } from "@/lib/agents";
import { prisma } from "@/lib/db";
import { embedText, rankAgentAnnouncements } from "@/lib/nvidia";
import { Agent, AgentCategory, AgentMatch } from "@/lib/types";

type PublishedAgentForSearch = {
  id: string;
  name: string;
  description: string;
  priceSats: number;
  hostingMode: "SELF_HOSTED" | "MARKET_HOSTED";
  hostingPlan: string | null;
  status: string;
  apiPath: string | null;
  owner?: {
    name: string | null;
    email: string;
  };
};

type ChromaAgentMetadata = {
  name?: string;
  priceSats?: number;
  status?: string;
};

const COLLECTION_NAME = process.env.CHROMA_COLLECTION ?? "published_agents";
const DEFAULT_CHROMA_URL = "http://localhost:8000";

function chromaClient() {
  const url = new URL(process.env.CHROMA_URL ?? DEFAULT_CHROMA_URL);
  const headers = process.env.CHROMA_API_KEY
    ? { Authorization: `Bearer ${process.env.CHROMA_API_KEY}` }
    : undefined;

  return new ChromaClient({
    host: url.hostname,
    port: Number(url.port || (url.protocol === "https:" ? 443 : 8000)),
    ssl: url.protocol === "https:",
    headers,
  });
}

async function agentCollection() {
  return chromaClient().getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: null,
  });
}

function taglineFromDescription(description: string) {
  const firstSentence = description.split(/[.!?]/)[0]?.trim();
  return (firstSentence || description).slice(0, 120);
}

function tagsFromText(text: string) {
  const stopWords = new Set(["agent", "with", "from", "that", "this", "your", "into", "will", "and", "the", "for"]);
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 6);
}

function categoryFromText(text: string): AgentCategory {
  const haystack = text.toLowerCase();
  if (/(hotel|travel|booking|trip|flight)/.test(haystack)) return "Travel";
  if (/(teach|tutor|learn|student|school|education)/.test(haystack)) return "Education";
  if (/(scrape|data|csv|json|dataset|analytics)/.test(haystack)) return "Data";
  if (/(code|github|pull request|security|test|engineering)/.test(haystack)) return "Engineering";
  if (/(gpu|compute|vram|training|inference|render)/.test(haystack)) return "Compute";
  if (/(market|sales|business|growth|contract|legal)/.test(haystack)) return "Business";
  return "Research";
}

export function publishedAgentToMarketplaceAgent(agent: PublishedAgentForSearch): Agent {
  const text = `${agent.name} ${agent.description}`;
  const publisher = agent.owner?.name || agent.owner?.email.split("@")[0] || "Marketplace publisher";

  return {
    id: agent.id,
    name: agent.name,
    publisher,
    tagline: taglineFromDescription(agent.description),
    description: agent.description,
    category: categoryFromText(text),
    tags: tagsFromText(text),
    hostingMode: agent.hostingMode === "MARKET_HOSTED" ? "market-hosted" : "publisher-hosted",
    priceSats: agent.priceSats,
    rating: 4.5,
    reviewCount: 0,
    successRate: agent.status === "ACTIVE" ? 92 : 0,
    estimatedRuntime: agent.hostingMode === "MARKET_HOSTED" ? "2 min" : "3 min",
    refundable: true,
    parameters: [
      {
        id: "request",
        label: "Request",
        type: "textarea",
        placeholder: "Describe what you want this agent to do",
        required: true,
      },
    ],
    sampleOutput: "A completed agent response for the request you submit.",
    reviews: [],
  };
}

export async function getMarketplaceAgents() {
  const publishedAgents = await prisma.publishedAgent.findMany({
    where: { status: "ACTIVE" },
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return [...publishedAgents.map(publishedAgentToMarketplaceAgent), ...seededAgents];
}

export function buildAgentAnnouncement(agent: PublishedAgentForSearch) {
  return [
    `Name: ${agent.name}`,
    `Description: ${agent.description}`,
    `Price: ${agent.priceSats} sats per run`,
    `Hosting: ${agent.hostingMode === "MARKET_HOSTED" ? "marketplace hosted" : "publisher hosted"}`,
  ].join("\n");
}

export async function indexPublishedAgent(agent: PublishedAgentForSearch) {
  const document = buildAgentAnnouncement(agent);
  const embedding = await embedText(document, "passage");
  const collection = await agentCollection();

  await collection.upsert({
    ids: [agent.id],
    embeddings: [embedding],
    documents: [document],
    metadatas: [
      {
        name: agent.name,
        priceSats: agent.priceSats,
        status: agent.status,
        apiPath: agent.apiPath ?? "",
      },
    ],
  });
}

function lexicalFallbackMatches(agents: Agent[], query: string): AgentMatch[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  return agents
    .map((agent) => {
      const haystack = [agent.name, agent.tagline, agent.description, agent.tags.join(" ")].join(" ").toLowerCase();
      const hits = tokens.filter((token) => haystack.includes(token));
      return {
        agent,
        score: hits.length * 20 + agent.rating * 10 + agent.successRate / 2,
        reasons: [hits.length ? `Matches ${hits.slice(0, 3).join(", ")}` : "Marketplace fallback match"],
        badge: "Strong match" as const,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export async function semanticSearchAgents(query: string): Promise<AgentMatch[]> {
  const agents = await getMarketplaceAgents();
  const publishedById = new Map(agents.filter((agent) => !seededAgents.some((seeded) => seeded.id === agent.id)).map((agent) => [agent.id, agent]));

  if (query.trim().length < 2 || publishedById.size === 0) {
    return lexicalFallbackMatches(agents, query || "best marketplace agent");
  }

  try {
    const embedding = await embedText(query, "query");
    const collection = await agentCollection();
    const result = await collection.query<ChromaAgentMetadata>({
      queryEmbeddings: [embedding],
      nResults: Math.min(8, publishedById.size),
      include: ["distances", "metadatas", "documents"],
    });

    const ids = result.ids[0] ?? [];
    const distances = result.distances?.[0] ?? [];
    const candidates = ids
      .map((id, index) => {
        const agent = publishedById.get(id);
        if (!agent) return null;
        return {
          id,
          name: agent.name,
          description: agent.description,
          priceSats: agent.priceSats,
          distance: distances[index] ?? null,
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

    const ranking = await rankAgentAnnouncements(query, candidates);
    const rankedIds = ranking.length ? ranking.map((item) => item.id) : candidates.map((item) => item.id);
    const reasonById = new Map(ranking.map((item) => [item.id, item.reason]));

    const semanticMatches = rankedIds.reduce<AgentMatch[]>((matches, id, index) => {
        const agent = publishedById.get(id);
        if (!agent) return matches;
        const distance = candidates.find((candidate) => candidate.id === id)?.distance;
        matches.push({
          agent,
          score: Math.round(1000 - (distance ?? index) * 100),
          reasons: [reasonById.get(id) ?? "Closest semantic match in Chroma"],
          badge: index === 0 ? ("Best rated" as const) : ("Strong match" as const),
        });
        return matches;
      }, []);

    const staticMatches = lexicalFallbackMatches(seededAgents, query).slice(0, Math.max(0, 6 - semanticMatches.length));
    return [...semanticMatches, ...staticMatches].slice(0, 6);
  } catch (error) {
    console.error("Semantic search failed, using lexical fallback.", error);
    return lexicalFallbackMatches(agents, query);
  }
}
