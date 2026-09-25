"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function ConfirmForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (error) {
      setError(error.message ?? "Reset failed. The link may have expired.");
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <p className="mt-6 text-sm text-red-600">
        Missing reset token. Please request a new link from{" "}
        <Link href="/reset-password" className="underline">reset password</Link>.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        Password updated.{" "}
        <Link href="/login" className="font-medium text-emerald-700 underline">
          Log in
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        New password (min 8 characters)
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
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Confirm new password
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 font-normal"
          autoComplete="new-password"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-emerald-800 px-5 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetConfirmPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-zinc-900">Choose a new password</h1>
      <Suspense>
        <ConfirmForm />
      </Suspense>
    </main>
  );
}
