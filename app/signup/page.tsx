import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Sign up — Agent Market",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-lg flex-col items-center justify-center px-6 py-24 text-zinc-100">
      <section className="w-full rounded-xl border border-zinc-900 bg-zinc-950/30 p-8 shadow-2xl shadow-black sm:p-12">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-light tracking-tight text-white">Create an account</h1>
          <p className="mt-3 text-sm font-light text-zinc-500">Sign up to save activity and run agents.</p>
        </header>
        <SignupForm />
      </section>
    </main>
  );
}
