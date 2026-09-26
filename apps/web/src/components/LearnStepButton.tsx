"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Mark a module step complete; advances the teacher's progress. */
export function LearnStepButton({
  slug,
  step,
  done,
}: {
  slug: string;
  step: number;
  done: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (done) {
    return <span className="text-sm font-medium text-emerald-700">Done ✓</span>;
  }

  async function mark() {
    setPending(true);
    await fetch(`/api/learn/${slug}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedStep: step }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={mark}
      disabled={pending}
      className="rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : "Mark step done"}
    </button>
  );
}
