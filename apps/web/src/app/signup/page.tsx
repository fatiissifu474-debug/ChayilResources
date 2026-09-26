"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPublisher, setIsPublisher] = useState(false);
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setPending(false);
      setError(error.message ?? "Sign up failed. Please try again.");
      return;
    }
    if (isPublisher) {
      const res = await fetch("/api/profile/publisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization }),
      });
      if (!res.ok) {
        setPending(false);
        setError("Account created, but publisher registration failed. Contact support.");
        return;
      }
    }
    setPending(false);
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-zinc-900">Create your teacher account</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700 underline">
          Log in
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 font-normal"
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 font-normal"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Password (min 8 characters)
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 font-normal"
            autoComplete="new-password"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={isPublisher}
            onChange={(e) => setIsPublisher(e.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-800"
          />
          <span>I publish educational content (publisher account for an organization)</span>
        </label>
        {isPublisher && (
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Organization
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Sunrise Press"
              className="rounded-md border border-zinc-300 px-3 py-2 font-normal"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-800 px-5 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
