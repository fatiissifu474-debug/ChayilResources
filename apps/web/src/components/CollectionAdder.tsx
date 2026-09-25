"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
}

/** Add-to-collection control for the resource detail page. */
export function CollectionAdder({ resourceId, authed }: { resourceId: string; authed: boolean }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState("");
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/collections")
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((d) => {
        setCollections(d.collections ?? []);
        if (d.collections?.length > 0) setSelected(d.collections[0].id);
      })
      .catch(() => {});
  }, [authed]);

  if (!authed) {
    return (
      <p className="text-sm text-zinc-600">
        <Link href="/login" className="font-medium text-emerald-700 underline">Log in</Link>{" "}
        to organize this into a collection.
      </p>
    );
  }

  async function addTo(collectionId: string) {
    setPending(true);
    setMessage(null);
    const res = await fetch(`/api/collections/${collectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
    setPending(false);
    setMessage(res.ok ? "Added to collection ✓" : "Could not add. Please try again.");
  }

  async function createAndAdd() {
    const name = newName.trim();
    if (!name) return;
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setPending(false);
      setMessage("Could not create collection.");
      return;
    }
    const { collection } = await res.json();
    setCollections((c) => [{ id: collection.id, name: collection.name }, ...c]);
    setSelected(collection.id);
    setNewName("");
    await addTo(collection.id);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Add to a collection</h3>
      {collections.length > 0 ? (
        <div className="mt-2 flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !selected}
            onClick={() => addTo(selected)}
            className="shrink-0 rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">No collections yet — create one below.</p>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New collection, e.g. BECE Preparation"
          className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={pending || !newName.trim()}
          onClick={createAndAdd}
          className="shrink-0 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-50"
        >
          Create & add
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
