import { MarketplaceApp } from "@/components/marketplace/marketplace-app";
import { getMarketplaceAgents } from "@/lib/semantic-agent-search";

export default async function Home() {
  const agents = await getMarketplaceAgents();
  return <MarketplaceApp initialAgents={agents} />;
}
