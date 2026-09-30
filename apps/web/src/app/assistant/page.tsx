import { redirect } from "next/navigation";
import { getViewer } from "@/lib/require-user";
import { SiteHeader } from "@/components/SiteHeader";
import { AssistantForm } from "@/components/AssistantForm";

/** AI lesson-preparation assistant (Groq-powered, login required). */
export default async function AssistantPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Lesson-prep assistant ✨</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tell it your class, subject and topic — get objectives, activities, a worked
          example and checks, plus matching library resources.
        </p>
        <div className="mt-4">
          <AssistantForm />
        </div>
      </main>
    </>
  );
}
