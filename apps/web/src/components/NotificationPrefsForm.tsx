"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Prefs {
  newInSubjects: boolean;
  savedUpdates: boolean;
  announcements: boolean;
}

const ROWS: Array<{ key: keyof Prefs; label: string; hint: string }> = [
  { key: "newInSubjects", label: "New in your subjects", hint: "New resources for classes you teach" },
  { key: "savedUpdates", label: "Saved resource updates", hint: "When something you saved changes" },
  { key: "announcements", label: "Announcements", hint: "Important platform news (rare)" },
];

/** Granular notification preferences (PRD §23: teacher controls what they receive). */
export function NotificationPrefsForm() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.preferences) {
          setPrefs({
            newInSubjects: d.preferences.newInSubjects,
            savedUpdates: d.preferences.savedUpdates,
            announcements: d.preferences.announcements,
          });
        }
      })
      .catch(() => {});
  }, []);

  async function toggle(key: keyof Prefs) {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    setSaving(false);
    setMessage(res.ok ? "Preferences saved ✓" : "Could not save. Please try again.");
    router.refresh();
  }

  if (!prefs) return null;

  return (
    <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="font-semibold text-zinc-900">What you receive</h2>
      <div className="mt-2 flex flex-col gap-2">
        {ROWS.map((row) => (
          <label key={row.key} className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={prefs[row.key]}
              onChange={() => toggle(row.key)}
              disabled={saving}
              className="h-4 w-4 accent-emerald-800"
            />
            <span>
              <span className="font-medium text-zinc-900">{row.label}</span>{" "}
              <span className="text-zinc-500">— {row.hint}</span>
            </span>
          </label>
        ))}
      </div>
      {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
    </section>
  );
}
