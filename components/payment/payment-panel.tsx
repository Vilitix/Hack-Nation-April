"use client";

import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { createDemoInvoice, createPaymentHash, formatSats } from "@/lib/payments";
import { Agent } from "@/lib/types";

export function PaymentPanel({
  agent,
  onPaid,
}: {
  agent: Agent;
  onPaid: (payment: { paymentHash: string; preimage: string }) => void;
}) {
  const [status, setStatus] = useState<"idle" | "connecting" | "paid">("idle");
  const [error, setError] = useState("");
  const invoice = useMemo(() => createDemoInvoice(agent.id, agent.priceSats), [agent.id, agent.priceSats]);

  async function handleWalletPayment() {
    setError("");
    setStatus("connecting");

    try {
      const { requestProvider } = await import("@getalby/bitcoin-connect-react");
      await requestProvider();
      completeDemoPayment();
    } catch {
      setStatus("idle");
      setError("Wallet connection was cancelled. You can still settle the demo invoice below.");
    }
  }

  function completeDemoPayment() {
    const paymentHash = createPaymentHash();
    setStatus("paid");
    onPaid({
      paymentHash,
      preimage: `demo-preimage-${paymentHash.slice(0, 12)}`,
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-6 sm:p-8 shadow-2xl shadow-black">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h3 className="text-xl font-light tracking-tight text-white">Lightning checkout</h3>
          <p className="mt-2 text-sm font-light text-zinc-400">
            Connect a wallet, then settle a demo invoice for <span className="font-medium text-white">{formatSats(agent.priceSats)} sats</span>.
          </p>
        </div>
        <div className="rounded-full bg-zinc-900 p-3 text-zinc-300 border border-zinc-800 shrink-0">
          <Wallet size={20} strokeWidth={1.5} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-900 bg-zinc-950/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">Demo BOLT-11 invoice</div>
        </div>
        <div className="break-all font-mono text-xs text-zinc-300 leading-relaxed selection:bg-zinc-700">{invoice}</div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={handleWalletPayment}
          disabled={status !== "idle"}
          className="inline-flex items-center justify-center gap-3 rounded-md border border-zinc-700 bg-black px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wallet size={16} strokeWidth={1.5} />
          Connect wallet
        </button>
        <button
          onClick={handleWalletPayment}
          disabled={status !== "idle"}
          className="inline-flex items-center justify-center gap-3 rounded-md bg-white px-6 py-3.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "connecting" && <Loader2 className="animate-spin" size={16} strokeWidth={1.5} />}
          {status === "paid" && <CheckCircle2 size={16} strokeWidth={1.5} />}
          {status === "idle" ? "Pay with Alby flow" : status === "connecting" ? "Opening wallet" : "Paid"}
        </button>
      </div>

      {status === "idle" && (
        <button
          onClick={completeDemoPayment}
          className="mt-4 w-full rounded-md px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:bg-zinc-900/50"
        >
          Demo settle without wallet
        </button>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-900/30 bg-red-950/20 p-4">
          <p className="text-sm font-light text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
