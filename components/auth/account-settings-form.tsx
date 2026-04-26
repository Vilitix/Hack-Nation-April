"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountSettingsForm({
  initialName,
  initialEmail,
}: {
  initialName: string | null;
  initialEmail: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Update failed.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Account updated.");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {message && <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">{message}</div>}
      {error && <div className="rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="space-y-1.5">
        <label htmlFor="account-name" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Name
        </label>
        <input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="account-email" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
        />
        <p className="text-xs text-zinc-600">Changing email requires your current password.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="current-password" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Required for email or password changes"
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave empty to keep current password"
          className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-100 px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save secure changes"}
      </button>
    </form>
  );
}
