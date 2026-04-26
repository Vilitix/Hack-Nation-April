import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/db";
import { LogoutButton } from "@/components/auth/logout-button";
import { AccountSettingsForm } from "@/components/auth/account-settings-form";

export const metadata = {
  title: "Account — Agent Market",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    redirect("/login?next=/account");
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-20 text-zinc-100">
      <section className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 sm:p-10">
        <h1 className="text-2xl font-light text-white">My account</h1>
        <p className="mt-2 text-sm text-zinc-500">Change your name, email, and password securely.</p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Email</dt>
            <dd className="mt-1 text-zinc-200">{user.email}</dd>
          </div>
          {user.name && (
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Name</dt>
              <dd className="mt-1 text-zinc-200">{user.name}</dd>
            </div>
          )}
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Member since</dt>
            <dd className="mt-1 text-zinc-400">{user.createdAt.toLocaleDateString()}</dd>
          </div>
        </dl>
        <AccountSettingsForm initialName={user.name} initialEmail={user.email} />
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
            Back to marketplace
          </Link>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
