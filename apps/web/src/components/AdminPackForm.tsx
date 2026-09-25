"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = ["PRIMARY", "JHS", "SHS", "TVET"];

interface ClassLevel { id: string; level: string; name: string }
interface Subject { id: string; level: string; name: string }

const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

/** Staff: create a lesson-prep pack; items auto-assemble from approved resources. */
export function AdminPackForm() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [level, setLevel] = useState("JHS");
  const [classLevelId, setClassLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((t) => {
        setClasses(t.classes);
        setSubjects(t.subjects);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    const res = await fetch("/api/admin/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, objectives, level,
        classLevelId: classLevelId || null,
        subjectId: subjectId || null,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create pack.");
      return;
    }
    const data = await res.json();
    setMessage(`Pack created as draft with ${data.pack.itemsAssembled} resources. Approve it in the review queue to publish.`);
    setTitle("");
    setDescription("");
    setObjectives("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-zinc-700">Title*<input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Level*
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Description*<textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Learning objectives<textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Class
        <select value={classLevelId} onChange={(e) => setClassLevelId(e.target.value)} className={inputCls}>
          <option value="">—</option>
          {classes.filter((c) => c.level === level).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-zinc-700">Subject
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
          <option value="">—</option>
          {subjects.filter((s) => s.level === level).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {pending ? "Creating…" : "Create pack draft"}
        </button>
        {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}

export interface PackQueueItem {
  id: string;
  title: string;
  itemCount: number;
}

/** Staff: approve/reject draft packs. */
export function AdminPackQueue({ packs }: { packs: PackQueueItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    setPendingId(id);
    await fetch(`/api/admin/packs/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setPendingId(null);
    router.refresh();
  }

  if (packs.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">No draft packs.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {packs.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
          <span className="font-medium text-zinc-900">{p.title} <span className="text-zinc-500">· {p.itemCount} items</span></span>
          <span className="flex shrink-0 gap-2">
            <button type="button" disabled={pendingId === p.id} onClick={() => decide(p.id, "approve")} className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Approve</button>
            <button type="button" disabled={pendingId === p.id} onClick={() => decide(p.id, "reject")} className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50">Reject</button>
          </span>
        </div>
      ))}
    </div>
  );
}
