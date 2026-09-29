"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface ModPost {
  id: string;
  title: string;
  author: string;
  hidden: boolean;
  flagged: boolean;
}

/** Staff: review flagged posts; hide/unhide/delete. */
export function AdminCommunity({ initial }: { initial: ModPost[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setHidden(id: string, hidden: boolean) {
    setPendingId(id);
    await fetch(`/api/admin/community/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    setPendingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setPendingId(id);
    await fetch(`/api/admin/community/${id}`, { method: "DELETE" });
    setPendingId(null);
    router.refresh();
  }

  if (initial.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">Nothing flagged — community is healthy.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {initial.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
          <span>
            <Link href={`/community/${p.id}`} className="font-medium text-zinc-900 hover:underline">
              {p.title}
            </Link>{" "}
            <span className="text-zinc-500">
              by {p.author}
              {p.flagged && !p.hidden ? " · ⚑ reported" : ""}
              {p.hidden ? " · hidden" : ""}
            </span>
          </span>
          <span className="flex shrink-0 gap-2">
            <button type="button" disabled={pendingId === p.id} onClick={() => setHidden(p.id, !p.hidden)} className="rounded-full border border-zinc-300 px-3 py-1 text-xs disabled:opacity-50">
              {p.hidden ? "Unhide" : "Hide"}
            </button>
            <button type="button" disabled={pendingId === p.id} onClick={() => remove(p.id)} className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50">
              Delete
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
