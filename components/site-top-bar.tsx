import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/login", label: "Login" },
];

export function SiteTopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm font-medium tracking-tight text-zinc-100 transition-colors hover:text-white">
          Agent Marketplace.
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200 sm:text-sm tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
