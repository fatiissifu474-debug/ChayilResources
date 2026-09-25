"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password/confirm",
      });
    } catch {
      // Neutral response either way (anti-enumeration).
    }
    setPending(false);
    setDone(true);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-zinc-900">Reset your password</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Remember it?{" "}
        <Link href="/login" className="font-medium text-emerald-700 underline">
          Log in
        </Link>
      </p>
      {done ? (
        <p className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          If an account exists for this email, a reset link is on its way.
          (Local dev: find it in the server console.)
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
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
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-emerald-800 px-5 py-2.5 font-medium text-white disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </main>
  );
}
