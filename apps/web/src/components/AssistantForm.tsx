"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClassLevel {
  id: string;
  level: string;
  name: string;
}

interface Match {
  id: string;
  title: string;
  subject: { name: string } | null;
  classLevel: { name: string } | null;
}

interface Prep {
  objectives: string[];
  starter: string;
  mainActivities: string[];
  workedExample: string;
  checks: string[];
  homework: string;
  differentiation: string;
}

const LEVELS = ["PRIMARY", "JHS", "SHS", "TVET"];
const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

/** Lesson-preparation assistant form + structured results. */
export function AssistantForm() {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [level, setLevel] = useState("JHS");
  const [classLevelId, setClassLevelId] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prep, setPrep] = useState<Prep | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((t) => setClasses(t.classes ?? []))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPrep(null);
    setMatches([]);
    setPending(true);
    const res = await fetch("/api/assistant/prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, classLevelId: classLevelId || undefined, subject, topic }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "The assistant is unavailable right now.");
      return;
    }
    const data = await res.json();
    setPrep(data.prep);
    setMatches(data.matches ?? []);
  }

  return (
    <div>
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700">Level*
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">Class
          <select value={classLevelId} onChange={(e) => setClassLevelId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {classes.filter((c) => c.level === level).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">Subject*<input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" className={inputCls} /></label>
        <label className="text-sm font-medium text-zinc-700">Topic*<input required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Equivalent fractions" className={inputCls} /></label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-full bg-amber-800 px-6 py-2.5 font-medium text-white disabled:opacity-50">
            {pending ? "Preparing… (takes ~10s)" : "✨ Prepare my lesson"}
          </button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {prep && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-bold text-zinc-900">Your lesson plan</h2>
          <h3 className="mt-4 font-semibold text-zinc-900">Objectives</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-700">{prep.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
          <h3 className="mt-4 font-semibold text-zinc-900">Starter (5 min)</h3>
          <p className="text-sm text-zinc-700">{prep.starter}</p>
          <h3 className="mt-4 font-semibold text-zinc-900">Main activities</h3>
          <ol className="list-decimal pl-5 text-sm text-zinc-700">{prep.mainActivities.map((a, i) => <li key={i}>{a}</li>)}</ol>
          <h3 className="mt-4 font-semibold text-zinc-900">Worked example</h3>
          <p className="whitespace-pre-line text-sm text-zinc-700">{prep.workedExample}</p>
          <h3 className="mt-4 font-semibold text-zinc-900">Checks for understanding</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-700">{prep.checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
          <h3 className="mt-4 font-semibold text-zinc-900">Homework</h3>
          <p className="text-sm text-zinc-700">{prep.homework}</p>
          <h3 className="mt-4 font-semibold text-zinc-900">Differentiation</h3>
          <p className="text-sm text-zinc-700">{prep.differentiation}</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-zinc-900">From your library</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {matches.map((m) => (
              <li key={m.id} className="text-sm">
                <Link href={`/resources/${m.id}`} className="text-amber-900 hover:underline">{m.title}</Link>
                <span className="text-zinc-500"> · {[m.classLevel?.name, m.subject?.name].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
