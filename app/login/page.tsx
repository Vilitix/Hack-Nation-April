"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-lg flex-col items-center justify-center px-6 py-24 text-zinc-100">
      <section className="w-full rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 shadow-2xl shadow-black sm:p-12">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-light tracking-tight text-white">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-3 text-sm font-light text-zinc-500">
            {isLogin
              ? "Sign in to access your dashboard."
              : "Join the Agent Economy and deploy Lightning-native agents."}
          </p>
        </header>

        <form className="space-y-6">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Satoshi Nakamoto"
                className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm font-light text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:bg-zinc-950"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm font-light text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:bg-zinc-950"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-zinc-800 bg-black px-4 py-3 text-sm font-light text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:bg-zinc-950"
            />
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-md bg-zinc-100 px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            {isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-zinc-900 pt-6">
          <p className="text-xs font-light text-zinc-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors"
            >
              {isLogin ? "Create one now" : "Sign in instead"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
