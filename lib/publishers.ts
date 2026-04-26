import { agents } from "@/lib/agents";
import { Agent } from "@/lib/types";

export function publisherToSlug(publisher: string): string {
  return publisher.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getPublisherAgentsBySlug(publisherSlug: string): Agent[] {
  return agents.filter((agent) => publisherToSlug(agent.publisher) === publisherSlug);
}

export function getPublisherBySlug(publisherSlug: string): string | null {
  const match = agents.find((agent) => publisherToSlug(agent.publisher) === publisherSlug);
  return match?.publisher ?? null;
}

export function getPublisherStats(publisherAgents: Agent[]) {
  const totalAgents = publisherAgents.length;

  if (!totalAgents) {
    return {
      totalAgents: 0,
      averageRating: 0,
      averageSuccessRate: 0,
      averagePriceSats: 0,
      totalReviews: 0,
      topAgent: null as Agent | null,
    };
  }

  const totals = publisherAgents.reduce(
    (acc, agent) => {
      acc.rating += agent.rating;
      acc.successRate += agent.successRate;
      acc.priceSats += agent.priceSats;
      acc.reviewCount += agent.reviewCount;
      return acc;
    },
    { rating: 0, successRate: 0, priceSats: 0, reviewCount: 0 },
  );

  const topAgent = [...publisherAgents].sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }

    return b.reviewCount - a.reviewCount;
  })[0];

  return {
    totalAgents,
    averageRating: totals.rating / totalAgents,
    averageSuccessRate: totals.successRate / totalAgents,
    averagePriceSats: Math.round(totals.priceSats / totalAgents),
    totalReviews: totals.reviewCount,
    topAgent,
  };
}
