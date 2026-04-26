"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgentDetailModal } from "@/components/marketplace/agent-detail-modal";
import { agents as seededAgents } from "@/lib/agents";
import { matchAgents } from "@/lib/matcher";
import { formatSats } from "@/lib/payments";
import { Agent } from "@/lib/types";

const typingExamples = [
  "I want to scrape all data on maps around Nancy city",
  "I want a clean CSV of every local business nearby",
  "I want the best data agent for this job",
];

export function MarketplaceApp() {
  const [query, setQuery] = useState("");
  const [typedExample, setTypedExample] = useState("");
  const [modalAgent, setModalAgent] = useState<Agent | null>(null);

  const matches = useMemo(() => matchAgents(seededAgents, query || typingExamples[0], "All"), [query]);
  const agentsOfTheDay = useMemo(() => {
    const bestRated = [...seededAgents].sort((a, b) => b.successRate - a.successRate)[0];
    const cheapest = [...seededAgents].sort((a, b) => a.priceSats - b.priceSats)[0];
    const strongMatch = matches[0]?.agent;
    const picks = [strongMatch, bestRated, cheapest].filter((agent): agent is typeof seededAgents[number] => Boolean(agent));
    return Array.from(new Map(picks.map((agent) => [agent.id, agent])).values()).slice(0, 3);
  }, [matches]);
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
    <main className="relative flex h-screen min-h-[640px] overflow-hidden px-4 py-8 text-zinc-100 sm:px-8 bg-black">
      <section className="relative mx-auto flex w-full max-w-6xl flex-col h-full">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-3xl">
            <div className="relative flex items-center rounded-full border border-zinc-800 bg-zinc-950/40 px-6 py-4 transition-colors focus-within:border-zinc-400">
              <Search className="mr-4 shrink-0 text-zinc-500" size={20} strokeWidth={1.5} />
              <label className="relative flex min-w-0 flex-1 items-center">
                {!query && (
                  <span className="pointer-events-none absolute left-0 right-0 truncate text-left text-lg font-light text-zinc-600 sm:text-2xl">
                    {typedExample}
                    <span className="typing-caret ml-1 inline-block h-6 w-[1px] translate-y-1 bg-zinc-500" />
                  </span>
                )}
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="relative z-10 w-full bg-transparent py-1 text-left text-lg font-light text-zinc-100 outline-none placeholder:text-transparent sm:text-2xl"
                  placeholder={typingExamples[0]}
                  aria-label="Search for an agent"
                />
              </label>
            </div>
          </div>

          <div className="mt-8 w-full max-w-3xl text-left">
            <div className="mb-2.5 flex items-center gap-3">
              <div className="text-[8px] font-medium uppercase tracking-[0.24em] text-zinc-500">Selection of the Day</div>
              <div className="h-[1px] flex-1 bg-zinc-900" />
            </div>
            
            <div className="grid gap-2 sm:grid-cols-3">
              {agentsOfTheDay.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setQuery(agent.name);
                    setModalAgent(agent);
                  }}
                  className="group flex flex-col items-start justify-between rounded-lg border border-zinc-900 bg-zinc-950/50 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
                >
                  <div className="w-full">
                    <div className="truncate text-left text-[11px] font-medium text-zinc-300 transition-colors group-hover:text-white">{agent.name}</div>
                    <div className="mt-2 flex w-full items-center justify-between">
                      <span className="text-[10px] font-medium text-zinc-500">{formatSats(agent.priceSats)} sats</span>
                      <span className="text-[9px] text-zinc-500">{agent.successRate}% success</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 w-full max-w-3xl">
            <div className="mb-3 flex items-center px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
              <span>Network Activity</span>
            </div>
            <div className="relative -mx-4 overflow-hidden sm:-mx-8">
              <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent" />
              <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent" />
              <div className="agent-stream flex w-max gap-4 px-4 sm:px-8">
                {offerCards.map((agent, index) => (
                  <button
                    key={`${agent.id}-${index}`}
                    type="button"
                    onClick={() => {
                      setQuery(agent.name);
                      setModalAgent(agent);
                    }}
                    className="w-64 shrink-0 rounded-lg border border-zinc-900 bg-black p-4 text-left transition-colors hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-zinc-200">{agent.name}</span>
                      <span className="text-xs font-medium text-zinc-400">{formatSats(agent.priceSats)}</span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-[11px] font-light text-zinc-500">{agent.tagline}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 w-full max-w-3xl text-center text-xs text-zinc-600">
            Open any card to see full details, reviews, and use the agent.
          </p>
        </div>

        <AgentDetailModal agent={modalAgent} onClose={() => setModalAgent(null)} />
      </section>
    </main>
  );
}
