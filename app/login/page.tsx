export default function LoginPage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-lg px-6 py-24 text-zinc-100 flex flex-col items-center justify-center">
      <section className="w-full rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 sm:p-12 shadow-2xl shadow-black">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-light tracking-tight text-white">Welcome back</h1>
          <p className="mt-3 text-sm font-light text-zinc-500">Sign in to access your dashboard.</p>
        </header>

        <form className="space-y-6">
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
            Sign in
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs font-light text-zinc-600">
            Don't have an account? <span className="font-medium text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors">Request access</span>
          </p>
        </div>
      </section>
    </main>
  );
}
