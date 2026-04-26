export function createDemoInvoice(agentId: string, sats: number) {
  const seed = `${agentId}-${sats}-agent-market-demo`.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `lnbc${sats}n1pagentmarket${seed.slice(0, 40)}`;
}

export function createPaymentHash() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function formatSats(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
