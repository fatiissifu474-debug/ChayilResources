"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const KINDS = [
  "USEFUL",
  "NOT_USEFUL",
  "APPROPRIATE",
  "NEEDS_IMPROVEMENT",
  "INCORRECT",
  "OUTDATED",
  "INAPPROPRIATE",
] as const;

export function FeedbackWidget({
  resourceId,
  counts,
  authed,
}: {
  resourceId: string;
  counts: Record<string, number>;
  authed: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (!authed) {
    return (
      <p className="text-sm text-zinc-600">
        <Link href="/login" className="font-medium text-emerald-700 underline">
          Log in
        </Link>{" "}
        to rate this resource.
        {total > 0 && (
          <span className="ml-2">
            {Object.entries(counts)
              .map(([k, c]) => `${c} ${k.toLowerCase().replace(/_/g, " ")}`)
              .join(" · ")}
          </span>
        )}
      </p>
    );
  }

  async function submit() {
    if (!kind) return;
    setError(null);
    setPending(true);
    const res = await fetch(`/api/resources/${resourceId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, comment }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not submit feedback. Please try again.");
      return;
    }
    setThanks(true);
    setKind(null);
    setComment("");
    router.refresh();
  }

  return (
    <div>
      {total > 0 && (
        <p className="text-sm text-zinc-600">
          Teacher feedback:{" "}
          {Object.entries(counts)
            .map(([k, c]) => `${c} ${k.toLowerCase().replace(/_/g, " ")}`)
            .join(" · ")}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setThanks(false);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              kind === k
                ? "border-emerald-800 bg-emerald-50 text-emerald-900"
                : "border-zinc-300 text-zinc-700"
            }`}
          >
            {k.toLowerCase().replace(/_/g, " ")}
          </button>
        ))}
      </div>
      {kind && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment (e.g. what needs improvement?)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Submit feedback"}
            </button>
          </div>
        </div>
      )}
      {thanks && <p className="mt-2 text-sm text-emerald-700">Thanks — your feedback helps improve quality.</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
