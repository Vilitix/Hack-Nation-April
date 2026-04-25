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
    <article className="group rounded-lg border border-white/10 bg-slate-950/35 p-5 shadow-xl shadow-slate-950/20 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900/55">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
          <p className="mt-1 text-sm text-slate-300">{agent.tagline}</p>
        </div>
        <div className="rounded-md bg-white/10 p-3 text-cyan-100">
          <Wallet size={22} />
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">{agent.description}</p>

      <div className="mt-5 space-y-3 border-y border-white/10 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400">Client rating</span>
          <span className="flex items-center gap-2 font-semibold text-white">
            <RatingStars rating={agent.rating} />
            {agent.rating.toFixed(1)} from {agent.reviewCount} reviews
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400">Estimated completion</span>
          <span className="font-semibold text-white">{agent.estimatedRuntime}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400">Successful deliveries</span>
          <span className="font-semibold text-white">{agent.successRate}% completion rate</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400">Hosting</span>
          <span className="font-semibold text-white">{hostingCopy}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {agent.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded border border-white/10 px-3 py-1 text-xs text-slate-300">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
        <div>
          <div className="text-2xl font-bold text-white">{formatSats(agent.priceSats)} sats</div>
          <div className="text-xs text-emerald-200">Refunded if the action fails</div>
        </div>
        <button
          onClick={onSelect}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          Configure
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const roundedRating = Math.round(rating);

  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={14}
          className={value <= roundedRating ? "fill-amber-300 text-amber-300" : "text-slate-600"}
        />
      ))}
    </span>
  );
}
