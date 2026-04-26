"use client";

import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDemoInvoice, createPaymentHash, formatSats } from "@/lib/payments";

type Plan = {
  id: string;
  label: string;
  monthlySats: number;
  description: string;
};

type CreatedAgent = {
  id: string;
  name: string;
  status: string;
  apiPath: string | null;
  hostingMode: string;
  hostingPlan: string | null;
};

export function PublishAgentForm({ plans, baseUrl }: { plans: Plan[]; baseUrl: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"SELF_HOSTED" | "MARKET_HOSTED">("SELF_HOSTED");
  const [plan, setPlan] = useState(plans[0]?.id ?? "VRAM_16");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceSats, setPriceSats] = useState("1000");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [port, setPort] = useState("443");
  const [created, setCreated] = useState<{ agent: CreatedAgent; apiToken: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const selectedPlan = plans.find((p) => p.id === plan) ?? plans[0];
  const invoice = useMemo(() => {
    if (!created || !selectedPlan) return "";
    return `lnbc${selectedPlan.monthlySats}n1phosting${created.agent.id.replace(/[^a-z0-9]/gi, "").slice(0, 24)}`;
  }, [created, selectedPlan]);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreated(null);
    setPending(true);
    try {
      const res = await fetch("/api/publisher/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priceSats: Number(priceSats),
          hostingMode: mode,
          hostingPlan: mode === "MARKET_HOSTED" ? plan : undefined,
          endpointUrl: mode === "SELF_HOSTED" ? endpointUrl : undefined,
          port: mode === "SELF_HOSTED" ? Number(port) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not publish agent.");
        return;
      }
      setCreated(data);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function activateHosted() {
    if (!created) return;
    setPaying(true);
    setError("");
    try {
      const paymentHash = createPaymentHash();
      const res = await fetch(`/api/publisher/agents/${created.agent.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentHash, preimage: `demo-preimage-${paymentHash.slice(0, 12)}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Payment activation failed.");
        return;
      }
      setCreated((prev) => (prev ? { ...prev, agent: data.agent } : prev));
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPaying(false);
    }
  }

  const apiUrl = created?.agent.apiPath ? `${baseUrl}/api/agents/${created.agent.apiPath}/run` : "";

  return (
    <section className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 sm:p-8">
      <h2 className="text-xl font-light text-white">Publish an agent</h2>
      <p className="mt-2 text-sm text-zinc-500">Choose self-hosting or pay for marketplace-hosted VRAM.</p>

      <form onSubmit={publish} className="mt-6 space-y-5">
        {error && <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("SELF_HOSTED")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              mode === "SELF_HOSTED" ? "border-zinc-400 bg-zinc-900/60" : "border-zinc-800 bg-black hover:border-zinc-600"
            }`}
          >
            <div className="text-sm font-medium text-zinc-100">Self host</div>
            <p className="mt-1 text-xs text-zinc-500">Use your own HTTPS endpoint and receive a secure API token.</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("MARKET_HOSTED")}
            className={`rounded-lg border p-4 text-left transition-colors ${
              mode === "MARKET_HOSTED" ? "border-zinc-400 bg-zinc-900/60" : "border-zinc-800 bg-black hover:border-zinc-600"
            }`}
          >
            <div className="text-sm font-medium text-zinc-100">Host here</div>
            <p className="mt-1 text-xs text-zinc-500">Choose a VRAM VPS plan, pay, and get an active API endpoint.</p>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">Agent name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">Price per run (sats)</label>
            <input type="number" min="1" value={priceSats} onChange={(e) => setPriceSats(e.target.value)} required className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
        </div>

        {mode === "SELF_HOSTED" ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">Secure HTTPS endpoint</label>
              <input type="url" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://your-agent.example.com/run" required className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-zinc-500" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">Port</label>
              <input type="number" min="1" max="65535" value={port} onChange={(e) => setPort(e.target.value)} required className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  plan === p.id ? "border-zinc-400 bg-zinc-900/60" : "border-zinc-800 bg-black hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-100">{p.label}</span>
                  <span className="text-xs text-zinc-400">{formatSats(p.monthlySats)} sats</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
              </button>
            ))}
          </div>
        )}

        <button type="submit" disabled={pending} className="w-full rounded-md bg-white px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Publishing..." : mode === "SELF_HOSTED" ? "Publish self-hosted agent" : "Create hosted agent"}
        </button>
      </form>

      {created && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-black p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
            <CheckCircle2 size={16} />
            Agent created
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">API link</div>
              <code className="mt-1 block break-all rounded-md bg-zinc-950 p-3 text-xs text-zinc-300">{apiUrl}</code>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Bearer token (shown once)</div>
              <code className="mt-1 block break-all rounded-md bg-zinc-950 p-3 text-xs text-zinc-300">{created.apiToken}</code>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(`curl -X POST ${apiUrl} -H \"Authorization: Bearer ${created.apiToken}\" -H \"Content-Type: application/json\" -d '{}'`)}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900"
          >
            <Copy size={14} />
            Copy cURL
          </button>

          {created.agent.hostingMode === "MARKET_HOSTED" && created.agent.status !== "ACTIVE" && selectedPlan && (
            <div className="mt-5 rounded-lg border border-zinc-900 bg-zinc-950/60 p-4">
              <div className="text-sm text-white">Activate hosted VPS</div>
              <p className="mt-1 text-xs text-zinc-500">Demo invoice: <span className="font-mono text-zinc-400">{invoice || createDemoInvoice(created.agent.id, selectedPlan.monthlySats)}</span></p>
              <button
                type="button"
                onClick={activateHosted}
                disabled={paying}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-60"
              >
                {paying && <Loader2 className="animate-spin" size={16} />}
                Pay {formatSats(selectedPlan.monthlySats)} sats and activate
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
