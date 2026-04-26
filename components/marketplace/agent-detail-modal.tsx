"use client";

import { X, Star, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { PaymentPanel } from "@/components/payment/payment-panel";
import { formatSats } from "@/lib/payments";
import { publisherToSlug } from "@/lib/publishers";
import { Agent, ParameterField } from "@/lib/types";

function paramRequired(field: ParameterField) {
  return "required" in field && field.required;
}

function canSubmitParameters(agent: Agent, values: Record<string, string>) {
  for (const p of agent.parameters) {
    if (paramRequired(p) && !values[p.id]?.trim()) return false;
  }
  return true;
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          size={12}
          strokeWidth={v <= rounded ? 0 : 1.5}
          className={v <= rounded ? "fill-zinc-300 text-zinc-300" : "text-zinc-700"}
        />
      ))}
    </span>
  );
}

function ParameterFieldInput({
  field,
  value,
  onChange,
  id,
}: {
  field: ParameterField;
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const common =
    "w-full rounded-md border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={common + " min-h-[88px] resize-y"}
        required={paramRequired(field)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={common + " appearance-none bg-[length:1rem] bg-[right_0.5rem_center] pr-8"}
        required={paramRequired(field)}
      >
        <option value="">{field.placeholder}</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  const type =
    field.type === "date" ? "date" : field.type === "number" ? "number" : field.type === "url" ? "url" : "text";

  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={common}
      required={paramRequired(field)}
    />
  );
}

export function AgentDetailModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"detail" | "pay">("detail");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (agent) {
      setStep("detail");
      setParamValues({});
      setPaid(false);
    }
  }, [agent?.id]);

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!agent) return;
    document.addEventListener("keydown", onEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = prev;
    };
  }, [agent, onEscape]);

  if (!mounted || !agent) return null;

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(90vh,860px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black">
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 border-b border-zinc-800 px-3 py-4 sm:px-6 sm:py-4">
          <div className="flex justify-start">
            {step === "pay" && !paid && (
              <button
                type="button"
                onClick={() => setStep("detail")}
                className="inline-flex items-center gap-1.5 rounded-md p-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
              >
                <ArrowLeft size={18} />
              </button>
            )}
          </div>
          <div className="min-w-0 text-center">
            <h2 id={titleId} className="truncate text-lg font-light text-white sm:text-xl">
              {agent.name}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{formatSats(agent.priceSats)} sats</p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === "detail" && (
            <div className="p-5 sm:p-6">
              <p className="text-sm font-light text-zinc-300">{agent.tagline}</p>
              <p className="mt-4 text-sm font-light leading-relaxed text-zinc-400">{agent.description}</p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                  <span className="text-2xl font-light text-white">{formatSats(agent.priceSats)}</span>
                  <span className="text-zinc-500">sats</span>
                  {agent.refundable && (
                    <span className="ml-1 rounded border border-zinc-800 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Refund on failure
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>{agent.successRate}% success</div>
                  <div className="mt-0.5">{agent.estimatedRuntime} typical</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <StarRating rating={agent.rating} />
                <span className="font-medium text-zinc-300">{agent.rating.toFixed(1)}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">{agent.reviewCount} reviews</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">{agent.hostingMode === "market-hosted" ? "Market hosted" : "Publisher hosted"}</span>
              </div>

              <div className="mt-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Publisher</span>
                <div className="mt-1">
                  <Link
                    href={`/publishers/${publisherToSlug(agent.publisher)}`}
                    className="text-sm font-medium text-zinc-300 hover:text-white hover:underline underline-offset-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {agent.publisher}
                  </Link>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {agent.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-0.5 text-[11px] text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-zinc-900 pt-5">
                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Reviews</div>
                {agent.reviews.map((r, i) => (
                  <article key={`${r.author}-${i}`} className="rounded-lg border border-zinc-900/80 bg-zinc-900/20 p-4">
                    <p className="text-sm font-light italic leading-relaxed text-zinc-300">&ldquo;{r.comment}&rdquo;</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-medium text-zinc-400">{r.author}</span>
                      <span>{r.rating.toFixed(1)} / 5</span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setStep("pay")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
                >
                  <Sparkles size={16} />
                  Use this agent
                </button>
              </div>
            </div>
          )}

          {step === "pay" && !paid && (
            <div className="p-5 sm:p-6">
              <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">Job parameters</h3>
              <p className="mt-1 text-sm font-light text-zinc-400">Fill in the fields below, then pay to queue the run.</p>

              <div className="mt-5 space-y-4">
                {agent.parameters.length === 0 && (
                  <p className="text-sm text-zinc-500">No extra parameters — proceed to payment.</p>
                )}
                {agent.parameters.map((field) => {
                  const fieldId = `param-${agent.id}-${field.id}`;
                  return (
                    <div key={field.id}>
                      <label htmlFor={fieldId} className="mb-1.5 block text-xs font-medium text-zinc-400">
                        {field.label}
                        {paramRequired(field) && <span className="text-zinc-600"> *</span>}
                      </label>
                      <ParameterFieldInput
                        field={field}
                        id={fieldId}
                        value={paramValues[field.id] ?? ""}
                        onChange={(v) => setParamValues((prev) => ({ ...prev, [field.id]: v }))}
                      />
                    </div>
                  );
                })}
              </div>

              {agent.sampleOutput && (
                <p className="mt-4 text-xs text-zinc-500">
                  <span className="text-zinc-600">Sample output: </span>
                  {agent.sampleOutput}
                </p>
              )}

              <div className="mt-8">
                {agent.parameters.length > 0 && !canSubmitParameters(agent, paramValues) && (
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
                    <p className="text-sm text-zinc-500">Complete the required fields above to unlock Lightning checkout.</p>
                  </div>
                )}
                {(canSubmitParameters(agent, paramValues) || agent.parameters.length === 0) && (
                  <PaymentPanel
                    agent={agent}
                    onPaid={() => {
                      setPaid(true);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {step === "pay" && paid && (
            <div className="p-8 text-center">
              <p className="text-lg font-light text-white">Payment received</p>
              <p className="mt-2 text-sm text-zinc-400">Your job is queued. You can close this window.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-md border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
