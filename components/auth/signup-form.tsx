"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Sign up failed.");
        return;
      }
      router.refresh();
      router.push("/");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {error && (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500" htmlFor="signup-name">
          Name <span className="font-normal text-zinc-600">(optional)</span>
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm font-light text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:bg-zinc-950"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500" htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@company.com"
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm font-light text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:bg-zinc-950"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500" htmlFor="signup-password">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm font-light text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:bg-zinc-950"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-md bg-zinc-100 px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <div className="pt-2 text-center">
        <p className="text-xs font-light text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-400 transition-colors hover:text-zinc-300">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
