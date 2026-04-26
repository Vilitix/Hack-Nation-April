const NVIDIA_API_BASE_URL = process.env.NVIDIA_API_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const NVIDIA_EMBEDDING_MODEL = process.env.NVIDIA_EMBEDDING_MODEL ?? "nvidia/nv-embedqa-e5-v5";
const NVIDIA_SEARCH_MODEL = process.env.NVIDIA_SEARCH_MODEL ?? "meta/llama-3.1-70b-instruct";

type NvidiaEmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

type NvidiaChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function apiKey() {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) {
    throw new Error("NVIDIA_API_KEY is required for semantic agent search.");
  }
  return key;
}

async function nvidiaFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${NVIDIA_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `NVIDIA API request failed with ${response.status}.`);
  }

  return payload;
}

export async function embedText(text: string, inputType: "passage" | "query") {
  const payload = await nvidiaFetch<NvidiaEmbeddingResponse>("/embeddings", {
    input: [text],
    model: NVIDIA_EMBEDDING_MODEL,
    input_type: inputType,
  });

  const embedding = payload.data?.[0]?.embedding;
  if (!embedding?.length) {
    throw new Error("NVIDIA embedding response did not include an embedding.");
  }

  return embedding;
}

export type AgentRankingCandidate = {
  id: string;
  name: string;
  description: string;
  priceSats: number;
  distance: number | null;
};

export type AgentRanking = {
  id: string;
  reason: string;
};

function parseJsonArray(content: string): AgentRanking[] {
  const stripped = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(stripped) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as { id?: unknown; reason?: unknown };
      if (typeof candidate.id !== "string") return null;
      return {
        id: candidate.id,
        reason: typeof candidate.reason === "string" ? candidate.reason : "Strong semantic match",
      };
    })
    .filter((item): item is AgentRanking => Boolean(item));
}

export async function rankAgentAnnouncements(query: string, candidates: AgentRankingCandidate[]) {
  if (candidates.length === 0) return [];

  const payload = await nvidiaFetch<NvidiaChatResponse>("/chat/completions", {
    model: NVIDIA_SEARCH_MODEL,
    temperature: 0.1,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You rank marketplace agent announcements for a user request. Return only a JSON array of objects with id and reason. Use the provided ids exactly.",
      },
      {
        role: "user",
        content: JSON.stringify({
          userRequest: query,
          candidates,
          instruction: "Rank best matching announcements first. Keep each reason under 100 characters.",
        }),
      },
    ],
  });

  const content = payload.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    return parseJsonArray(content);
  } catch {
    return [];
  }
}
