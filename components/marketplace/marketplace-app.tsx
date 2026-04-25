"use client";

import { MapPinned, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { agents as seededAgents } from "@/lib/agents";
import { matchAgents } from "@/lib/matcher";
import { formatSats } from "@/lib/payments";

const typingExamples = [
  "I want to scrape all data on maps around Nancy city",
  "I want a clean CSV of every local business nearby",
  "I want the best data agent for this job",
];

export function MarketplaceApp() {
  const [query, setQuery] = useState("");
  const [typedExample, setTypedExample] = useState("");

  const matches = useMemo(() => matchAgents(seededAgents, query || typingExamples[0], "All"), [query]);
  const offerCards = useMemo(() => [...seededAgents, ...seededAgents, ...seededAgents], []);

  useEffect(() => {
    let exampleIndex = 0;
    let characterIndex = 0;
    let isDeleting = false;
    let timeoutId: number;

    function tick() {
      const currentExample = typingExamples[exampleIndex];
      setTypedExample(currentExample.slice(0, characterIndex));

      if (!isDeleting && characterIndex === currentExample.length) {
        isDeleting = true;
        timeoutId = window.setTimeout(tick, 1050);
        return;
      }

      if (isDeleting && characterIndex === 0) {
        isDeleting = false;
        exampleIndex = (exampleIndex + 1) % typingExamples.length;
      }

      characterIndex += isDeleting ? -1 : 1;
      timeoutId = window.setTimeout(tick, isDeleting ? 28 : 46);
    }

    tick();

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main className="relative flex h-screen min-h-[640px] overflow-hidden px-4 py-5 text-white sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-700/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-slate-800/25 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between rounded-md border border-white/10 bg-slate-950/80 px-4 py-2 text-xs sm:text-sm">
          <span className="font-medium text-slate-300">How it works: describe a task, compare agents, run and review outcomes.</span>
          <button className="rounded-md border border-white/15 bg-slate-900 px-3 py-1.5 font-semibold text-slate-200 transition hover:bg-slate-800">
            Log in
          </button>
        </div>

        <nav className="flex items-center justify-between">
          <div>
            <div className="font-bold tracking-wide">Agent Marketplace</div>
            <div className="text-xs text-slate-500">Professional execution marketplace</div>
          </div>
          <div />
        </nav>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mt-8 w-full max-w-4xl rounded-[1.7rem] border border-white/15 bg-slate-900/55 p-2 shadow-2xl shadow-black/50 backdrop-blur">
            <div className="relative flex min-h-20 items-center gap-3 rounded-[1.4rem] border border-white/10 bg-slate-950 px-4 shadow-inner shadow-black/50 sm:px-6">
              <Search className="shrink-0 text-slate-300" size={24} />
              <label className="relative flex min-w-0 flex-1 items-center">
                {!query && (
                  <span className="pointer-events-none absolute left-0 right-0 truncate text-left text-base font-semibold text-slate-300 sm:text-xl">
                    {typedExample}
                    <span className="typing-caret ml-1 inline-block h-6 w-0.5 translate-y-1 bg-slate-400" />
                  </span>
                )}
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="relative z-10 w-full bg-transparent py-5 text-left text-base font-semibold text-white outline-none placeholder:text-transparent sm:text-xl"
                  placeholder={typingExamples[0]}
                  aria-label="Search for an agent"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 grid w-full max-w-3xl gap-2 text-left sm:grid-cols-3">
            {matches.slice(0, 3).map((match) => (
              <div key={match.agent.id} className="rounded-md border border-white/10 bg-slate-950/75 p-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                  <MapPinned size={14} />
                  {match.badge}
                </div>
                <div className="mt-2 truncate font-bold">{match.agent.name}</div>
                <div className="text-xs text-slate-400">{formatSats(match.agent.priceSats)} sats</div>
              </div>
            ))}
          </div>
        </div>

        <div className="-mx-4 overflow-hidden border-t border-white/10 pb-2 pt-4 sm:-mx-6">
          <div className="mb-3 flex items-center justify-between px-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 sm:px-6">
            <span>Agent examples</span>
            <span className="text-slate-400">Live feed</span>
          </div>
          <div className="agent-stream flex w-max gap-3 px-4 sm:px-6">
            {offerCards.map((agent, index) => (
              <div
                key={`${agent.id}-${index}`}
                className="w-56 shrink-0 rounded-md border border-white/10 bg-slate-950 p-3 text-left shadow-xl shadow-black/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-black">{agent.name}</span>
                  <span className="text-xs font-bold text-slate-300">{formatSats(agent.priceSats)}</span>
                </div>
                <p className="mt-2 line-clamp-1 text-xs text-slate-400">{agent.tagline}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                  <span>{agent.category}</span>
                  <span>{agent.successRate}% success</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
