"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** One-click TEACHER → PUBLISHER upgrade for the publisher portal. */
export function PublisherUpgrade() {
  const router = useRouter();
  const [organization, setOrganization] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setError(null);
    setPending(true);
    const res = await fetch("/api/profile/publisher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upgrade failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="font-semibold text-zinc-900">Publish with us</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Register your organization to submit resources with publisher attribution.
        Everything is reviewed before joining the library.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Organization, e.g. Sunrise Press"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending}
          onClick={upgrade}
          className="shrink-0 rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Register
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
