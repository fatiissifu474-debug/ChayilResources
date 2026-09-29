"use client";

import { useEffect, useState } from "react";

interface Pack {
  id: string;
  title: string;
}

/** Propose this resource for a lesson pack (collaborative creation). */
export function PackSuggester({ resourceId, authed }: { resourceId: string; authed: boolean }) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/packs/list")
      .then((r) => (r.ok ? r.json() : { packs: [] }))
      .then((d) => {
        setPacks(d.packs ?? []);
        if (d.packs?.length > 0) setSelected(d.packs[0].id);
      })
      .catch(() => {});
  }, [authed]);

  if (!authed || packs.length === 0) return null;

  async function suggest() {
    if (!selected) return;
    setPending(true);
    setMessage(null);
    const res = await fetch(`/api/packs/${selected}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
    setPending(false);
    setMessage(res.ok ? "Suggested — reviewers will decide ✓" : "Could not suggest. Please try again.");
  }

  return (
    <div className="mt-2 flex gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        aria-label="Choose a pack"
      >
        {packs.map((p) => (
          <option key={p.id} value={p.id}>{p.title}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={suggest}
        className="shrink-0 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-50"
      >
        Suggest for pack
      </button>
      {message && <p className="self-center text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
