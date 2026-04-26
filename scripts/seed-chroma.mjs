import { ChromaClient } from "chromadb";

const NVIDIA_API_BASE_URL = process.env.NVIDIA_API_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const NVIDIA_EMBEDDING_MODEL = process.env.NVIDIA_EMBEDDING_MODEL ?? "nvidia/nv-embedqa-e5-v5";
const CHROMA_URL = process.env.CHROMA_URL ?? "http://localhost:8000";
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION ?? "published_agents";

function debug(message, details = {}) {
  console.log(`[market:seed] ${message} ${JSON.stringify(details)}`);
}

const dummyAgents = [
  {
    id: "dummy-math-professor-kids",
    name: "Kids Math Professor",
    description:
      "Finds a patient mathematics professor or tutor for a child, assesses the student's level, builds a practice plan, and recommends exercises for algebra, geometry, arithmetic, homework, and exam preparation.",
    priceSats: 700,
    hostingMode: "MARKET_HOSTED",
  },
  {
    id: "dummy-nancy-maps-scraper",
    name: "Nancy Maps Business Scraper",
    description:
      "Scrapes all businesses around Nancy city from maps, extracts names, addresses, phone numbers, websites, ratings, opening hours, and categories, then exports a clean CSV dataset.",
    priceSats: 1200,
    hostingMode: "MARKET_HOSTED",
  },
  {
    id: "dummy-contract-risk-reader",
    name: "Contract Risk Reader",
    description:
      "Reviews contract text, identifies risky clauses, summarizes obligations, highlights termination and payment risks, and suggests negotiation questions before signing.",
    priceSats: 900,
    hostingMode: "SELF_HOSTED",
  },
  {
    id: "dummy-gpu-training-planner",
    name: "GPU Training Planner",
    description:
      "Plans GPU workloads for AI model training, estimates VRAM requirements, chooses batch sizes, compares compute costs, and recommends the cheapest viable instance.",
    priceSats: 1500,
    hostingMode: "MARKET_HOSTED",
  },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Add it to .env before running this script.`);
  }
  return value;
}

function buildAnnouncement(agent) {
  return [
    `Name: ${agent.name}`,
    `Description: ${agent.description}`,
    `Price: ${agent.priceSats} sats per run`,
    `Hosting: ${agent.hostingMode === "MARKET_HOSTED" ? "marketplace hosted" : "publisher hosted"}`,
  ].join("\n");
}

async function embedText(text) {
  const startedAt = Date.now();
  debug("nvidia:embedding:start", { model: NVIDIA_EMBEDDING_MODEL, textLength: text.length });
  const response = await fetch(`${NVIDIA_API_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("NVIDIA_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: NVIDIA_EMBEDDING_MODEL,
      input_type: "passage",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `NVIDIA embedding failed with ${response.status}.`);
  }

  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("NVIDIA embedding response did not include an embedding.");
  }

  debug("nvidia:embedding:ok", {
    model: NVIDIA_EMBEDDING_MODEL,
    dimensions: embedding.length,
    durationMs: Date.now() - startedAt,
  });
  return embedding;
}

function chromaClient() {
  const url = new URL(CHROMA_URL);
  return new ChromaClient({
    host: url.hostname,
    port: Number(url.port || (url.protocol === "https:" ? 443 : 8000)),
    ssl: url.protocol === "https:",
    headers: process.env.CHROMA_API_KEY ? { Authorization: `Bearer ${process.env.CHROMA_API_KEY}` } : undefined,
  });
}

async function main() {
  debug("chroma:handshake:start", { url: CHROMA_URL, collection: CHROMA_COLLECTION });
  const client = chromaClient();
  await client.heartbeat();
  const collection = await client.getOrCreateCollection({
    name: CHROMA_COLLECTION,
    embeddingFunction: null,
  });
  debug("chroma:handshake:ok", { collection: CHROMA_COLLECTION, existingCount: await collection.count() });

  const documents = dummyAgents.map(buildAnnouncement);
  const embeddings = [];

  for (const [index, document] of documents.entries()) {
    debug("agent:embedding", { id: dummyAgents[index].id, name: dummyAgents[index].name });
    embeddings.push(await embedText(document));
  }

  debug("chroma:upsert:start", { ids: dummyAgents.map((agent) => agent.id) });
  await collection.upsert({
    ids: dummyAgents.map((agent) => agent.id),
    documents,
    embeddings,
    metadatas: dummyAgents.map((agent) => ({
      name: agent.name,
      priceSats: agent.priceSats,
      status: "ACTIVE",
      hostingMode: agent.hostingMode,
      apiPath: agent.id,
    })),
  });
  debug("chroma:upsert:ok", { collection: CHROMA_COLLECTION, newCount: await collection.count() });

  console.log(`Seeded ${dummyAgents.length} dummy agents into Chroma collection "${CHROMA_COLLECTION}".`);
  console.log('Try searching: "i am searching a professor of mathematics for my kid"');
  console.log('Try searching: "I want to scrape all data on maps around Nancy city"');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
