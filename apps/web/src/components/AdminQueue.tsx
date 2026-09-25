"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface QueueItem {
  id: string;
  title: string;
  type: string;
  level: string;
  className: string | null;
  subjectName: string | null;
  submittedBy: string | null;
  reviewStatus: string;
  createdAt: string;
}

export function AdminQueue({ initialPending }: { initialPending: QueueItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    setError(null);
    setPendingId(id);
    const res = await fetch(`/api/admin/resources/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setPendingId(null);
    if (!res.ok) {
      setError("Review action failed. Please try again.");
      return;
    }
    router.refresh();
  }

  if (initialPending.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">Queue is clear — nothing awaiting review.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {initialPending.map((r) => (
        <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="font-semibold text-zinc-900">{r.title}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {[r.className, r.subjectName, r.level, r.type.replace(/_/g, " "), r.reviewStatus]
              .filter(Boolean)
              .join(" · ")}
            {r.submittedBy && <> · Submitted by {r.submittedBy}</>}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pendingId === r.id}
              onClick={() => decide(r.id, "approve")}
              className="rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={pendingId === r.id}
              onClick={() => decide(r.id, "reject")}
              className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
