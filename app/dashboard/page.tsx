import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { formatSats } from "@/lib/payments";
import { hostingPlans } from "@/lib/publishing";
import { PublishAgentForm } from "@/components/dashboard/publish-agent-form";

export const metadata = {
  title: "Dashboard — Agent Market",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const [user, agents, headerList] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } }),
    prisma.publishedAgent.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
    headers(),
  ]);
  if (!user) redirect("/login?next=/dashboard");

  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const totalRevenue = agents.reduce((sum, agent) => sum + agent.revenueSats, 0);
  const totalRuns = agents.reduce((sum, agent) => sum + agent.runCount, 0);
  const planList = Object.entries(hostingPlans).map(([id, plan]) => ({ id, ...plan }));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 text-zinc-100">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Publish agents, activate hosting, and track generated revenue.
          </p>
        </div>
        <Link href="/account" className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
          Account settings
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5">
          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Published agents</div>
          <div className="mt-3 text-3xl font-light text-white">{agents.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5">
          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Revenue generated</div>
          <div className="mt-3 text-3xl font-light text-white">{formatSats(totalRevenue)} sats</div>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5">
          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">API runs</div>
          <div className="mt-3 text-3xl font-light text-white">{totalRuns}</div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <PublishAgentForm plans={planList} baseUrl={baseUrl} />

        <section className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 sm:p-8">
          <h2 className="text-xl font-light text-white">Your agents</h2>
          <div className="mt-6 space-y-4">
            {agents.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                No agents published yet.
              </p>
            )}
            {agents.map((agent) => (
              <article key={agent.id} className="rounded-lg border border-zinc-900 bg-black p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-zinc-100">{agent.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{agent.description}</p>
                  </div>
                  <span className="rounded-md border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
                    {agent.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-600">Hosting</dt>
                    <dd className="mt-1 text-zinc-300">
                      {agent.hostingMode === "SELF_HOSTED" ? "Self-hosted" : `Marketplace ${agent.hostingPlan?.replace("VRAM_", "")} GB`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Revenue</dt>
                    <dd className="mt-1 text-zinc-300">{formatSats(agent.revenueSats)} sats</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Runs</dt>
                    <dd className="mt-1 text-zinc-300">{agent.runCount}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Price/run</dt>
                    <dd className="mt-1 text-zinc-300">{formatSats(agent.priceSats)} sats</dd>
                  </div>
                </dl>
                {agent.apiPath && (
                  <code className="mt-4 block break-all rounded-md bg-zinc-950 p-3 text-[11px] text-zinc-400">
                    POST {baseUrl}/api/agents/{agent.apiPath}/run
                  </code>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
