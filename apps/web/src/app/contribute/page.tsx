"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RESOURCE_TYPES = [
  "LESSON_PLAN", "WORKSHEET", "ASSESSMENT", "QUIZ", "CLASSROOM_ACTIVITY",
  "TEACHING_STRATEGY", "READING_MATERIAL", "PRACTICAL_ACTIVITY", "PROJECT_IDEA",
  "REVISION_MATERIAL", "PRESENTATION", "VIDEO", "DIAGRAM", "POSTER", "OTHER",
];

const LEVELS = ["PRIMARY", "JHS", "SHS", "TVET"];

interface ClassLevel { id: string; level: string; name: string }
interface Subject { id: string; level: string; name: string }

const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

export default function ContributePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [level, setLevel] = useState("JHS");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((r) => {
      if (r.status === 401) router.push("/login");
    });
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((t) => {
        setClasses(t.classes);
        setSubjects(t.subjects);
      })
      .catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contributions", { method: "POST", body: form });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Submission failed.");
      return;
    }
    const data = await res.json();
    setDoneId(data.resource.id);
  }

  if (doneId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold text-zinc-900">Thank you!</h1>
        <p className="mt-2 text-zinc-600">
          Your resource was submitted and is awaiting review. You can track it under{" "}
          <Link href="/my-resources" className="font-medium text-emerald-700 underline">
            My resources → My contributions
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Contribute a resource</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Share lesson plans, worksheets, activities or assessments. Everything goes through
        review before joining the library — only original or openly-licensed work, please.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Title*<input name="title" required className={inputCls} /></label>
        <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Description*<textarea name="description" required rows={3} className={inputCls} /></label>
        <label className="text-sm font-medium text-zinc-700">Type*
          <select name="type" className={inputCls} defaultValue="WORKSHEET">
            {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">Level*
          <select name="level" value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">Class
          <select name="classLevelId" className={inputCls} defaultValue="">
            <option value="">—</option>
            {classes.filter((c) => c.level === level).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">Subject
          <select name="subjectId" className={inputCls} defaultValue="">
            <option value="">—</option>
            {subjects.filter((s) => s.level === level).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-zinc-700">Your name (as author)<input name="author" className={inputCls} /></label>
        <label className="text-sm font-medium text-zinc-700">Copyright holder*<input name="copyrightHolder" required placeholder="You, or the rights owner" className={inputCls} /></label>
        <label className="text-sm font-medium text-zinc-700 sm:col-span-2">File (optional — PDF, image, MP4, DOCX, PPTX, TXT, max 25 MB)<input ref={fileRef} name="file" type="file" className="mt-1 text-sm" /></label>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-full bg-emerald-800 px-6 py-2.5 font-medium text-white disabled:opacity-50">
            {pending ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      </form>
    </main>
  );
}
