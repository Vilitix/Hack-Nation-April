import { createHash, randomBytes } from "crypto";
import { HostingPlan } from "@prisma/client";

export const hostingPlans: Record<
  HostingPlan,
  { label: string; vramGb: number; monthlySats: number; description: string }
> = {
  VRAM_16: { label: "16 GB VRAM VPS", vramGb: 16, monthlySats: 16000, description: "Small inference jobs and light agents." },
  VRAM_32: { label: "32 GB VRAM VPS", vramGb: 32, monthlySats: 32000, description: "Reliable hosting for everyday agent traffic." },
  VRAM_80: { label: "80 GB VRAM VPS", vramGb: 80, monthlySats: 80000, description: "Large models and heavier workloads." },
  VRAM_200: { label: "200 GB VRAM VPS", vramGb: 200, monthlySats: 200000, description: "High-memory, high-throughput deployments." },
};

export function planPriceSats(plan: HostingPlan | null) {
  return plan ? hostingPlans[plan].monthlySats : 0;
}

export function generateApiToken() {
  return `ag_${randomBytes(32).toString("base64url")}`;
}

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function apiSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return `${base || "agent"}-${randomBytes(4).toString("hex")}`;
}
