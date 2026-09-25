"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Staff-only file attach control (rendered on the resource page for reviewers/admins). */
export function AdminFileUpload({ resourceId, hasFile }: { resourceId: string; hasFile: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setMessage(null);
    setError(null);
    setPending(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/resources/${resourceId}/file`, {
      method: "POST",
      body: form,
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    setMessage(hasFile ? "File replaced ✓" : "File attached ✓");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-zinc-900">
        Staff: {hasFile ? "replace file" : "attach file"} (PDF, image, MP4, DOCX, PPTX, TXT — max 25 MB)
      </h3>
      <div className="mt-2 flex gap-2">
        <input ref={inputRef} type="file" className="text-sm" />
        <button
          type="button"
          onClick={upload}
          disabled={pending}
          className="shrink-0 rounded-full bg-emerald-800 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
