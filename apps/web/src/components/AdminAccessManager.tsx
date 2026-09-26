"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AccessManagerData {
  institutions: Array<{
    id: string;
    name: string;
    code: string;
    active: boolean;
    members: Array<{ userId: string; name: string; email: string }>;
  }>;
  entitlements: Array<{
    id: string;
    kind: string;
    expiresAt: string | null;
    email: string;
    name: string;
  }>;
}

/** Staff: grant premium access, manage institutions and members (PRD §25). */
export function AdminAccessManager({ initial }: { initial: AccessManagerData }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("");
  const [instName, setInstName] = useState("");
  const [memberEmail, setMemberEmail] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: unknown): Promise<boolean> {
    setError(null);
    setMessage(null);
    setPending(true);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Action failed.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function grant() {
    if (!email.includes("@")) return;
    const daysNum = days.trim() ? Number(days) : undefined;
    const ok = await post("/api/admin/entitlements", {
      email: email.trim(),
      kind: "PREMIUM",
      ...(daysNum && daysNum > 0 ? { expiresInDays: daysNum } : {}),
    });
    if (ok) {
      setMessage(`Premium granted to ${email.trim()} ✓`);
      setEmail("");
      setDays("");
    }
  }

  async function createInstitution() {
    if (!instName.trim()) return;
    const ok = await post("/api/admin/institutions", { name: instName.trim() });
    if (ok) {
      setMessage(`Institution created — share its code with teachers ✓`);
      setInstName("");
    }
  }

  async function addMember(instId: string) {
    const em = (memberEmail[instId] ?? "").trim();
    if (!em.includes("@")) return;
    const ok = await post(`/api/admin/institutions/${instId}/members`, { email: em });
    if (ok) {
      setMessage(`Added ${em} ✓`);
      setMemberEmail((m) => ({ ...m, [instId]: "" }));
    }
  }

  async function removeMember(instId: string, userId: string) {
    setError(null);
    setPending(true);
    const res = await fetch(`/api/admin/institutions/${instId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not remove member.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Grant premium access</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@example.com" className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
          <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (blank = no expiry)" inputMode="numeric" className="w-48 rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
          <button type="button" disabled={pending} onClick={grant} className="rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">Grant</button>
        </div>
        {initial.entitlements.length > 0 && (
          <ul className="mt-2 text-sm text-zinc-600">
            {initial.entitlements.slice(0, 8).map((e) => (
              <li key={e.id}>{e.name} ({e.email}) — {e.kind}{e.expiresAt ? ` until ${new Date(e.expiresAt).toLocaleDateString()}` : " (no expiry)"}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Institutions</h3>
        <div className="mt-2 flex gap-2">
          <input value={instName} onChange={(e) => setInstName(e.target.value)} placeholder="e.g. Sunrise Basic School" className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
          <button type="button" disabled={pending} onClick={createInstitution} className="shrink-0 rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50">Create</button>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {initial.institutions.map((inst) => (
            <div key={inst.id} className="rounded border border-zinc-200 p-3">
              <p className="text-sm font-semibold text-zinc-900">
                {inst.name} <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs">code: {inst.code}</span>
              </p>
              <ul className="mt-1 text-sm text-zinc-600">
                {inst.members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between gap-2">
                    <span>{m.name} ({m.email})</span>
                    <button type="button" onClick={() => removeMember(inst.id, m.userId)} className="text-xs text-red-600 hover:underline">Remove</button>
                  </li>
                ))}
                {inst.members.length === 0 && <li className="text-zinc-400">No members yet.</li>}
              </ul>
              <div className="mt-2 flex gap-2">
                <input
                  value={memberEmail[inst.id] ?? ""}
                  onChange={(e) => setMemberEmail((m) => ({ ...m, [inst.id]: e.target.value }))}
                  placeholder="teacher@example.com"
                  className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
                />
                <button type="button" disabled={pending} onClick={() => addMember(inst.id)} className="shrink-0 rounded-full border border-zinc-300 px-3 py-1 text-sm disabled:opacity-50">Add</button>
              </div>
            </div>
          ))}
          {initial.institutions.length === 0 && <p className="text-sm text-zinc-500">No institutions yet.</p>}
        </div>
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
