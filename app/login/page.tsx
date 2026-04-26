import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in — Agent Market",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-lg flex-col items-center justify-center px-6 py-24 text-zinc-100">
      <section className="w-full rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 shadow-2xl shadow-black sm:p-12">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-light tracking-tight text-white">Welcome back</h1>
          <p className="mt-3 text-sm font-light text-zinc-500">Sign in to access your account.</p>
        </header>
        <LoginForm redirectTo={next} />
      </section>
    </main>
  );
}
