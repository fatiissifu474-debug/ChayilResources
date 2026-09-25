"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RESOURCE_TYPES = [
  "TEXTBOOK", "TEACHER_GUIDE", "LESSON_PLAN", "SCHEME_OF_LEARNING", "WORKSHEET",
  "ASSESSMENT", "QUIZ", "EXAM_PREP", "CLASSROOM_ACTIVITY", "TEACHING_STRATEGY",
  "REVISION_MATERIAL", "STUDENT_MATERIAL", "VIDEO", "DIAGRAM", "POSTER",
  "PRESENTATION", "READING_MATERIAL", "PRACTICAL_ACTIVITY", "PROJECT_IDEA",
  "REMEDIAL", "ENRICHMENT", "OTHER",
];

const LEVELS = ["PRIMARY", "JHS", "SHS", "TVET"];

interface ClassLevel { id: string; level: string; name: string }
interface Subject { id: string; level: string; name: string }

const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

export function AdminCreateForm() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("WORKSHEET");
  const [level, setLevel] = useState("JHS");
  const [classLevelId, setClassLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [author, setAuthor] = useState("");
  const [copyrightHolder, setCopyrightHolder] = useState("");
  const [permittedUse, setPermittedUse] = useState("Classroom use, no redistribution");
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
    const res = await fetch("/api/admin/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, type, level,
        classLevelId: classLevelId || null,
        subjectId: subjectId || null,
        author: author || null,
        copyrightHolder, permittedUse,
      }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create resource.");
      return;
    }
    setMessage("Draft created — it now appears in the review queue below.");
    setTitle("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-zinc-700">Title*<input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Type*
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
          {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Description*<textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} /></label>
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
      <label className="text-sm font-medium text-zinc-700">Subject
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputCls}>
          <option value="">—</option>
          {subjects.filter((s) => s.level === level).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-zinc-700">Author<input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Copyright holder*<input required value={copyrightHolder} onChange={(e) => setCopyrightHolder(e.target.value)} className={inputCls} /></label>
      <label className="text-sm font-medium text-zinc-700">Permitted use*<input required value={permittedUse} onChange={(e) => setPermittedUse(e.target.value)} className={inputCls} /></label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {pending ? "Creating…" : "Create draft"}
        </button>
        {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
