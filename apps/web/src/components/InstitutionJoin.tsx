"use client";

import { useState } from "react";

/** Teacher: join an institution with the code from your school or organization. */
export function InstitutionJoin() {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    if (!code.trim()) return;
    setMessage(null);
    setError(null);
    setPending(true);
    const res = await fetch("/api/institutions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not join.");
      return;
    }
    const data = await res.json();
    setMessage(`Joined ${data.institution.name} ✓ — premium resources are now unlocked.`);
    setCode("");
  }

  return (
    <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Join your school or organization</h3>
      <p className="mt-1 text-sm text-zinc-500">Enter the code from your school to unlock institutional access.</p>
      <div className="mt-2 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. A3F9C1"
          className="w-full rounded-md border border-zinc-300 px-3 py-1.5 font-mono text-sm"
        />
        <button
          type="button"
          disabled={pending || !code.trim()}
          onClick={join}
          className="shrink-0 rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Join
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
