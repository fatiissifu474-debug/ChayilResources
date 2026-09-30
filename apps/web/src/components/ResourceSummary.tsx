"use client";

import { useState } from "react";

/** AI summary for a resource preview (generated once, then cached). */
export function ResourceSummary({
  resourceId,
  initialSummary,
  authed,
}: {
  resourceId: string;
  initialSummary: string | null;
  authed: boolean;
}) {
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (summary) {
    return (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">✨ AI summary</h3>
        <p className="mt-1 text-sm text-zinc-700">{summary}</p>
      </div>
    );
  }

  if (!authed) return null;

  async function generate() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/resources/${resourceId}/summarize`, { method: "POST" });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not generate a summary.");
      return;
    }
    const data = await res.json();
    setSummary(data.summary);
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-900 disabled:opacity-50"
      >
        {pending ? "Summarizing…" : "✨ Summarize with AI"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
