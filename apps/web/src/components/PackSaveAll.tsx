"use client";

import { useState } from "react";

/** Save every resource in a lesson-prep pack with one click. */
export function PackSaveAll({ packId, authed, itemCount }: { packId: string; authed: boolean; itemCount: number }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!authed || itemCount === 0) return null;

  async function saveAll() {
    setPending(true);
    setMessage(null);
    const res = await fetch(`/api/packs/${packId}/save-all`, { method: "POST" });
    setPending(false);
    if (!res.ok) {
      setMessage("Could not save. Please try again.");
      return;
    }
    const data = await res.json();
    setMessage(`Saved ${data.saved} resource${data.saved === 1 ? "" : "s"} ✓`);
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={saveAll}
        disabled={pending}
        className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : `Save all ${itemCount} resources`}
      </button>
      {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
