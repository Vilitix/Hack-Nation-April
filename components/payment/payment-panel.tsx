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
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Lightning checkout</h3>
          <p className="mt-1 text-sm text-slate-300">
            Connect an Alby/NWC wallet, then settle a demo invoice for {formatSats(agent.priceSats)} sats.
          </p>
        </div>
        <div className="rounded-md bg-cyan-300/15 p-3 text-cyan-100">
          <Wallet size={22} />
        </div>
      </div>

      <div className="mt-4 rounded-md bg-slate-950/45 p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Demo BOLT-11 invoice</div>
        <div className="mt-2 break-all font-mono text-xs text-cyan-100">{invoice}</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={handleWalletPayment}
          disabled={status !== "idle"}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-3 font-bold text-cyan-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Wallet size={18} />
          Connect wallet
        </button>
        <button
          onClick={handleWalletPayment}
          disabled={status !== "idle"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "connecting" && <Loader2 className="animate-spin" size={18} />}
          {status === "paid" && <CheckCircle2 size={18} />}
          {status === "idle" ? "Pay with Alby flow" : status === "connecting" ? "Opening wallet" : "Paid"}
        </button>
      </div>

      {status === "idle" && (
        <button
          onClick={completeDemoPayment}
          className="mt-3 w-full rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-white/10"
        >
          Demo settle without wallet
        </button>
      )}

      {error && <p className="mt-3 text-sm text-amber-100">{error}</p>}
    </div>
  );
}
