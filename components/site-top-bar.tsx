import Link from "next/link";
import { getSession } from "@/lib/auth-session";
import { UserMenu } from "@/components/auth/user-menu";
import { prisma } from "@/lib/db";

const publicNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
] as const;

export async function SiteTopBar() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true, name: true },
      })
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="shrink-0 text-sm font-medium tracking-tight text-zinc-100 transition-colors hover:text-white">
          Agent Marketplace.
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-6">
          <nav className="flex min-w-0 items-center gap-4 sm:gap-6">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-medium tracking-wide text-zinc-500 transition-colors hover:text-zinc-200 sm:text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {user ? (
              <UserMenu name={user.name} email={user.email} />
            ) : (
              <Link
                href="/login"
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200 sm:text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
