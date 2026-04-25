import { ArrowRight, Star, Wallet } from "lucide-react";
import { formatSats } from "@/lib/payments";
import { AgentMatch } from "@/lib/types";

export function AgentCard({
  match,
  onSelect,
}: {
  match: AgentMatch;
  onSelect: () => void;
}) {
  const { agent } = match;
  const hostingCopy =
    agent.hostingMode === "market-hosted"
      ? "Managed by the marketplace"
      : "Hosted by the publisher";

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/30">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-light tracking-tight text-white">{agent.name}</h3>
            <p className="mt-2 text-sm font-light text-zinc-400">{agent.tagline}</p>
          </div>
          <div className="rounded-full bg-zinc-900 p-2.5 text-zinc-400 group-hover:text-white transition-colors border border-zinc-800">
            <Wallet size={18} strokeWidth={1.5} />
          </div>
        </div>

        <p className="mt-6 line-clamp-3 text-sm font-light leading-relaxed text-zinc-300">{agent.description}</p>

        <div className="mt-8 space-y-4 border-y border-zinc-900 py-6 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-zinc-500 font-light">Client rating</span>
            <span className="flex items-center gap-2 font-medium text-zinc-200">
              <RatingStars rating={agent.rating} />
              {agent.rating.toFixed(1)} from {agent.reviewCount} reviews
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-zinc-500 font-light">Estimated completion</span>
            <span className="font-medium text-zinc-200">{agent.estimatedRuntime}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-zinc-500 font-light">Successful deliveries</span>
            <span className="font-medium text-zinc-200">{agent.successRate}% completion rate</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-zinc-500 font-light">Hosting</span>
            <span className="font-medium text-zinc-200">{hostingCopy}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {agent.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[11px] font-medium tracking-wide text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-900 pt-6">
        <div>
          <div className="text-2xl font-light tracking-tight text-white">{formatSats(agent.priceSats)} <span className="text-sm text-zinc-500 ml-1 font-medium">sats</span></div>
          <div className="mt-1 text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Refunded on failure</div>
        </div>
        <button
          onClick={onSelect}
          className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Configure
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const roundedRating = Math.round(rating);

  return (
    <span className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={12}
          strokeWidth={value <= roundedRating ? 0 : 1.5}
          className={value <= roundedRating ? "fill-zinc-300 text-zinc-300" : "text-zinc-700"}
        />
      ))}
    </span>
  );
}
