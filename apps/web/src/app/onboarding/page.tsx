"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ClassLevel {
  id: string;
  level: string;
  name: string;
  position: number;
}

interface Subject {
  id: string;
  level: string;
  name: string;
}

const LEVELS = [
  { value: "PRIMARY", label: "Primary" },
  { value: "JHS", label: "JHS" },
  { value: "SHS", label: "SHS" },
  { value: "TVET", label: "TVET" },
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [taxRes, profileRes] = await Promise.all([
        fetch("/api/taxonomy"),
        fetch("/api/profile"),
      ]);
      if (profileRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!taxRes.ok) {
        setError("Could not load classes and subjects.");
        setLoading(false);
        return;
      }
      const tax = await taxRes.json();
      setClasses(tax.classes);
      setSubjects(tax.subjects);
      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        setLevels(profile.teachingLevels ?? []);
        setSubjectNames(profile.subjects ?? []);
        setSchool(profile.school ?? "");
      }
      setLoading(false);
    }
    void load();
  }, [router]);

  async function onSave() {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teachingLevels: levels, subjects: subjectNames, school }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save your profile. Please try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const visibleClasses = classes.filter((c) => levels.length === 0 || levels.includes(c.level));
  const visibleSubjects = subjects.filter((s) => levels.length === 0 || levels.includes(s.level));

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-16">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">What do you teach?</h1>
      <p className="mt-2 text-sm text-zinc-600">
        This personalizes your dashboard and recommendations. You can change it anytime.
      </p>

      <section className="mt-6">
        <h2 className="font-semibold text-zinc-900">1. Education level</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevels(toggle(levels, l.value))}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                levels.includes(l.value)
                  ? "border-emerald-800 bg-emerald-800 text-white"
                  : "border-zinc-300 text-zinc-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-zinc-900">2. My classes (optional)</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleClasses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClassIds(toggle(classIds, c.id))}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                classIds.includes(c.id)
                  ? "border-emerald-800 bg-emerald-50 text-emerald-900"
                  : "border-zinc-300 text-zinc-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-zinc-900">3. My subjects</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleSubjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubjectNames(toggle(subjectNames, s.name))}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                subjectNames.includes(s.name)
                  ? "border-emerald-800 bg-emerald-50 text-emerald-900"
                  : "border-zinc-300 text-zinc-700"
              }`}
            >
              {s.name} <span className="text-xs text-zinc-400">{s.level}</span>
            </button>
          ))}
          {visibleSubjects.length === 0 && (
            <p className="text-sm text-zinc-500">No subjects yet for this selection.</p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-zinc-900">4. School (optional)</h2>
        <input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="e.g. Sunrise Basic School"
          className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={onSave}
        disabled={saving || levels.length === 0}
        className="mt-8 rounded-full bg-emerald-800 px-6 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save and go to dashboard"}
      </button>
    </main>
  );
}
