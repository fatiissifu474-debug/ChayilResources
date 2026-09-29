"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  id: string;
  packTitle: string;
  resourceTitle: string;
  teacher: string;
}

interface PathDraft {
  id: string;
  title: string;
}

const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

/** Staff: review collaborative pack suggestions. */
export function AdminSuggestions({ initial }: { initial: Suggestion[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    setPendingId(id);
    await fetch(`/api/admin/suggestions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setPendingId(null);
    router.refresh();
  }

  if (initial.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">No pending suggestions.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {initial.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
          <span>
            <strong>{s.resourceTitle}</strong> <span className="text-zinc-500">→ {s.packTitle} · by {s.teacher}</span>
          </span>
          <span className="flex shrink-0 gap-2">
            <button type="button" disabled={pendingId === s.id} onClick={() => decide(s.id, "approve")} className="rounded-full bg-amber-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Approve</button>
            <button type="button" disabled={pendingId === s.id} onClick={() => decide(s.id, "reject")} className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50">Reject</button>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Staff: create a learning path from approved modules. */
export function AdminPathForm({ modules }: { modules: Array<{ id: string; title: string }> }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    const res = await fetch("/api/admin/paths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, moduleIds: picked }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create path.");
      return;
    }
    setMessage("Path draft created — approve it below to publish.");
    setTitle("");
    setDescription("");
    setPicked([]);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
      <label className="block text-sm font-medium text-zinc-700">Title*<input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></label>
      <label className="mt-2 block text-sm font-medium text-zinc-700">Description*<textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} /></label>
      <div className="mt-2">
        <p className="text-sm font-medium text-zinc-700">Modules (in order — click to add)</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {modules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${picked.includes(m.id) ? "border-amber-800 bg-amber-50 text-amber-900" : "border-zinc-300 text-zinc-700"}`}
            >
              {picked.includes(m.id) ? `${picked.indexOf(m.id) + 1}. ` : ""}{m.title}
            </button>
          ))}
          {modules.length === 0 && <p className="text-sm text-zinc-500">No approved modules yet.</p>}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="mt-3 rounded-full bg-amber-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Creating…" : "Create path draft"}
      </button>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
    </form>
  );
}

export interface PathQueueItem {
  id: string;
  title: string;
}

/** Staff: approve/reject draft paths. */
export function AdminPathQueue({ paths }: { paths: PathQueueItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    setPendingId(id);
    await fetch(`/api/admin/paths/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setPendingId(null);
    router.refresh();
  }

  if (paths.length === 0) return <p className="mt-2 text-sm text-zinc-500">No draft paths.</p>;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {paths.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
          <span className="font-medium text-zinc-900">{p.title}</span>
          <span className="flex shrink-0 gap-2">
            <button type="button" disabled={pendingId === p.id} onClick={() => decide(p.id, "approve")} className="rounded-full bg-amber-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Approve</button>
            <button type="button" disabled={pendingId === p.id} onClick={() => decide(p.id, "reject")} className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50">Reject</button>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Staff: post a platform announcement. */
export function AdminAnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setPending(false);
    if (!res.ok) {
      setMessage("Could not post.");
      return;
    }
    setMessage("Announcement posted ✓");
    setTitle("");
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
      <label className="block text-sm font-medium text-zinc-700">Title*<input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></label>
      <label className="mt-2 block text-sm font-medium text-zinc-700">Message*<textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={2} className={inputCls} /></label>
      <button type="submit" disabled={pending} className="mt-3 rounded-full bg-amber-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
        Post announcement
      </button>
      {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
    </form>
  );
}
