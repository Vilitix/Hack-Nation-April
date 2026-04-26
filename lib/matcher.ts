import { Agent, AgentCategory, AgentMatch } from "@/lib/types";

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const runtimeMinutes = (runtime: string) => Number(runtime.match(/\d+/)?.[0] ?? 10);

export function matchAgents(
  agents: Agent[],
  query: string,
  category: "All" | AgentCategory,
): AgentMatch[] {
  const queryTokens = tokenize(query);
  const cheapest = Math.min(...agents.map((agent) => agent.priceSats));
  const fastest = Math.min(...agents.map((agent) => runtimeMinutes(agent.estimatedRuntime)));
  const bestRating = Math.max(...agents.map((agent) => agent.rating));

  return agents
    .filter((agent) => category === "All" || agent.category === category)
    .map((agent) => {
      const haystack = tokenize(
        [
          agent.name,
          agent.tagline,
          agent.description,
          agent.category,
          agent.tags.join(" "),
          agent.sampleOutput,
        ].join(" "),
      );
      const matchedTokens = queryTokens.filter((token) =>
        haystack.some((word) => word.includes(token) || token.includes(word)),
      );
      const tagMatches = agent.tags.filter((tag) =>
        query.toLowerCase().includes(tag.toLowerCase()),
      );
      const qualityScore = agent.rating * 10 + agent.successRate / 2;
      const priceScore = Math.max(0, 25 - agent.priceSats / 120);
      const queryScore = queryTokens.length === 0 ? 15 : matchedTokens.length * 18 + tagMatches.length * 10;
      const categoryScore = category === agent.category ? 18 : 0;
      const score = Math.round(queryScore + qualityScore + priceScore + categoryScore);

      const reasons = [
        matchedTokens.length > 0
          ? `Matches ${matchedTokens.slice(0, 3).join(", ")}`
          : "Broad marketplace fit",
        `${agent.rating.toFixed(1)} star quality`,
        `${agent.successRate}% success rate`,
      ];

      let badge: AgentMatch["badge"] = "Strong match";
      if (agent.priceSats === cheapest) badge = "Cheapest";
      if (runtimeMinutes(agent.estimatedRuntime) === fastest) badge = "Fastest";
      if (agent.rating === bestRating) badge = "Best rated";
      if (agent.priceSats > 1800 && agent.rating >= 4.8) badge = "Premium";

      return { agent, score, reasons, badge };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function getPriceSuggestion(agent: Agent) {
  if (agent.rating >= 4.8 && agent.successRate >= 96 && agent.reviewCount > 50) {
    return {
      tone: "increase" as const,
      title: "Price increase suggested",
      message: `Quality is strong. Consider raising price to ${Math.round(agent.priceSats * 1.18)} sats.`,
    };
  }

  if (agent.rating < 4.5 || agent.successRate < 92) {
    return {
      tone: "improve" as const,
      title: "Improve before raising price",
      message: "Keep the current price and improve completion reliability before charging more.",
    };
  }

  return {
    tone: "hold" as const,
    title: "Price is balanced",
    message: "Reviews and success rate support the current price.",
  };
}
