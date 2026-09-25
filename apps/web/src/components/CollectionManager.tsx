"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ManagerCollection {
  id: string;
  name: string;
  items: Array<{
    resourceId: string;
    title: string;
    subjectName: string | null;
    className: string | null;
  }>;
}

/** Create / delete collections and remove items, for My Resources. */
export function CollectionManager({ initial }: { initial: ManagerCollection[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setPending(true);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not create collection.");
      return;
    }
    setName("");
    router.refresh();
  }

  async function removeCollection(id: string) {
    setError(null);
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete collection.");
      return;
    }
    router.refresh();
  }

  async function removeItem(collectionId: string, resourceId: string) {
    setError(null);
    const res = await fetch(`/api/collections/${collectionId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
    if (!res.ok) {
      setError("Could not remove item.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={create} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection, e.g. Term 1 Resources"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="shrink-0 rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Create
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {initial.length === 0 && (
          <p className="text-sm text-zinc-500">
            No collections yet. Group resources your way — e.g. “JHS 1 English”, “BECE Preparation”.
          </p>
        )}
        {initial.map((c) => (
          <div key={c.id} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">{c.name} ({c.items.length})</h3>
              <button
                type="button"
                onClick={() => removeCollection(c.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
            {c.items.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">Empty — add resources from any resource page.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {c.items.map((item) => (
                  <li key={item.resourceId} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/resources/${item.resourceId}`} className="text-emerald-900 hover:underline">
                      {item.title}
                      <span className="text-zinc-500">
                        {" "}· {[item.className, item.subjectName].filter(Boolean).join(" · ")}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(c.id, item.resourceId)}
                      className="shrink-0 text-zinc-400 hover:text-red-600"
                      title="Remove from collection"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
