"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StepDraft {
  title: string;
  body: string;
}

const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

/** Staff: create a learning module with ordered steps (draft). */
export function AdminModuleForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [duration, setDuration] = useState("");
  const [audience, setAudience] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([{ title: "", body: "" }]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setStep(i: number, patch: Partial<StepDraft>) {
    setSteps((s) => s.map((st, j) => (j === i ? { ...st, ...patch } : st)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    const res = await fetch("/api/admin/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        objectives: objectives || undefined,
        durationMinutes: duration.trim() ? Number(duration) : undefined,
        audience: audience || undefined,
        steps,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create module.");
      return;
    }
    setMessage("Module draft created — approve it below to publish.");
    setTitle("");
    setDescription("");
    setObjectives("");
    setDuration("");
    setAudience("");
    setSteps([{ title: "", body: "" }]);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-zinc-700">Title*<input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Duration (minutes)<input value={duration} onChange={(e) => setDuration(e.target.value)} inputMode="numeric" className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Description*<textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Objectives<textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Audience<input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. JHS teachers" className={inputCls} /></label>
      <div className="sm:col-span-2">
        <h3 className="text-sm font-semibold text-zinc-900">Steps</h3>
        {steps.map((s, i) => (
          <div key={i} className="mt-2 rounded border border-zinc-200 p-3">
            <input value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} placeholder={`Step ${i + 1} title`} className={inputCls} />
            <textarea value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} placeholder="Step content" rows={3} className={`${inputCls} mt-2`} />
            {steps.length > 1 && (
              <button type="button" onClick={() => setSteps((all) => all.filter((_, j) => j !== i))} className="mt-1 text-xs text-red-600 hover:underline">Remove step</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSteps((s) => [...s, { title: "", body: "" }])} className="mt-2 text-sm text-emerald-700 underline">+ Add step</button>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {pending ? "Creating…" : "Create module draft"}
        </button>
        {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}

export interface ModuleQueueItem {
  id: string;
  title: string;
  stepCount: number;
}

/** Staff: approve/reject draft modules. */
export function AdminModuleQueue({ modules }: { modules: ModuleQueueItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(id: string, decision: "approve" | "reject") {
    setPendingId(id);
    await fetch(`/api/admin/modules/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setPendingId(null);
    router.refresh();
  }

  if (modules.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">No draft modules.</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {modules.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm">
          <span className="font-medium text-zinc-900">{m.title} <span className="text-zinc-500">· {m.stepCount} steps</span></span>
          <span className="flex shrink-0 gap-2">
            <button type="button" disabled={pendingId === m.id} onClick={() => decide(m.id, "approve")} className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Approve</button>
            <button type="button" disabled={pendingId === m.id} onClick={() => decide(m.id, "reject")} className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 disabled:opacity-50">Reject</button>
          </span>
        </div>
      ))}
    </div>
  );
}
