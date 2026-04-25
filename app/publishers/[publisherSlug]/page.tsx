import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Trophy } from "lucide-react";
import { getPublisherAgentsBySlug, getPublisherBySlug, getPublisherStats } from "@/lib/publishers";
import { formatSats } from "@/lib/payments";

export default async function PublisherPage({
  params,
}: {
  params: Promise<{ publisherSlug: string }>;
}) {
  const { publisherSlug } = await params;
  const publisher = getPublisherBySlug(publisherSlug);

  if (!publisher) {
    notFound();
  }

  const publisherAgents = getPublisherAgentsBySlug(publisherSlug);
  const stats = getPublisherStats(publisherAgents);
  const sortedAgents = [...publisherAgents].sort((a, b) => b.rating - a.rating);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl overflow-y-auto px-6 pb-24 pt-16 sm:px-8 text-zinc-100">
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 sm:p-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back to marketplace
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-8 border-b border-zinc-900 pb-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Publisher Profile</p>
            <h1 className="mt-3 text-4xl font-light tracking-tight text-white sm:text-5xl">{publisher}</h1>
            <p className="mt-4 text-sm font-light leading-relaxed text-zinc-400">
              Performance snapshot across every agent currently published by this account.
            </p>
          </div>
          {stats.topAgent && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                <Trophy size={14} strokeWidth={1.5} />
                Top Performer
              </div>
              <div className="mt-2 text-sm font-medium text-white">{stats.topAgent.name}</div>
              <div className="mt-1 text-xs font-light text-zinc-500">
                {stats.topAgent.rating.toFixed(1)} / 5 from {stats.topAgent.reviewCount} reviews
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Agents" value={stats.totalAgents.toString()} />
          <MetricCard label="Avg Rating" value={`${stats.averageRating.toFixed(2)} / 5`} />
          <MetricCard label="Total Reviews" value={stats.totalReviews.toString()} />
          <MetricCard label="Avg Success" value={`${stats.averageSuccessRate.toFixed(1)}%`} />
          <MetricCard label="Avg Price" value={`${formatSats(stats.averagePriceSats)} sats`} />
        </div>
      </div>

      <section className="mt-12 rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 sm:p-12">
        <header className="mb-8">
          <h2 className="text-2xl font-light tracking-tight text-white">Published Agents</h2>
          <p className="mt-2 text-sm font-light text-zinc-400">Sorted by rating so the best-performing offers appear first.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {sortedAgents.map((agent) => (
            <article key={agent.id} className="flex flex-col justify-between rounded-lg border border-zinc-900 bg-zinc-900/20 p-6 transition-colors hover:border-zinc-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-light text-white">{agent.name}</h3>
                  <p className="mt-2 text-xs font-light leading-relaxed text-zinc-400">{agent.tagline}</p>
                </div>
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-300 bg-zinc-900/50 whitespace-nowrap">
                  {agent.category}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400 border-t border-zinc-900 pt-4">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <Star size={12} strokeWidth={1.5} className="fill-zinc-300 text-zinc-300" />
                  {agent.rating.toFixed(1)}
                </span>
                <span className="text-zinc-700">•</span>
                <span>{agent.reviewCount} reviews</span>
                <span className="text-zinc-700">•</span>
                <span>{agent.successRate}% success</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-200">{formatSats(agent.priceSats)} sats</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-900/20 p-5">
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-3 text-2xl font-light text-white tracking-tight">{value}</div>
    </div>
  );
}
