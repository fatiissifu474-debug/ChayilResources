"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SaveButton({
  resourceId,
  initialSaved,
  authed,
}: {
  resourceId: string;
  initialSaved: boolean;
  authed: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  if (!authed) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700"
      >
        Log in to save
      </Link>
    );
  }

  async function toggle() {
    setPending(true);
    const res = await fetch(`/api/resources/${resourceId}/save`, {
      method: saved ? "DELETE" : "POST",
    });
    setPending(false);
    if (res.ok) {
      setSaved(!saved);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50 ${
        saved ? "bg-emerald-100 text-emerald-900" : "bg-emerald-800 text-white"
      }`}
    >
      {pending ? "…" : saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
