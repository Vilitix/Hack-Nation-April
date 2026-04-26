"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

export function UserMenu({ name, email }: { name: string | null; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = name?.trim() || email;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="max-w-[10rem] truncate rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white sm:max-w-[14rem] sm:text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black"
        >
          <div className="border-b border-zinc-900 px-4 py-3">
            <p className="truncate text-sm font-medium text-zinc-200">{label}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-600">{email}</p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            className="block px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            onClick={() => setOpen(false)}
          >
            My account
          </Link>
          <Link
            href="/dashboard"
            role="menuitem"
            className="block px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <div className="border-t border-zinc-900 px-4 py-3">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
