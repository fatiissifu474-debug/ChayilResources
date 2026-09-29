"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm";

export function NewPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, tag: tag || undefined }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not post.");
      return;
    }
    const data = await res.json();
    router.push(`/community/${data.post.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="font-semibold text-zinc-900">Start a discussion</h2>
      <label className="mt-2 block text-sm font-medium text-zinc-700">Title*<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How do you teach equivalent fractions?" className={inputCls} /></label>
      <label className="mt-2 block text-sm font-medium text-zinc-700">Details*<textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={inputCls} /></label>
      <label className="mt-2 block text-sm font-medium text-zinc-700">Tag (optional)<input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. JHS Mathematics" className={inputCls} /></label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="mt-3 rounded-full bg-amber-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Posting…" : "Post discussion"}
      </button>
    </form>
  );
}

export function ReplyForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    await fetch(`/api/community/posts/${postId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setPending(false);
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Share your idea or experience…" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={pending || !body.trim()} className="mt-2 rounded-full bg-amber-800 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
        Reply
      </button>
    </form>
  );
}

export function ReportButton({ postId }: { postId: string }) {
  const [done, setDone] = useState(false);

  async function report() {
    await fetch(`/api/community/posts/${postId}/report`, { method: "POST" });
    setDone(true);
  }

  if (done) return <span className="text-xs text-zinc-500">Reported — moderators will review ✓</span>;
  return (
    <button type="button" onClick={report} className="text-xs text-zinc-400 hover:text-red-600 hover:underline">
      Report
    </button>
  );
}
