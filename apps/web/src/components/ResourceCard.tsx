import Link from "next/link";

export interface CardResource {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  badges: string[];
  subjectName: string | null;
  className: string | null;
}

const BADGE_STYLES: Record<string, string> = {
  REVIEWED: "bg-green-100 text-green-800",
  CURRICULUM_ALIGNED: "bg-blue-100 text-blue-800",
  CONTRIBUTOR: "bg-purple-100 text-purple-800",
  RECOMMENDED: "bg-amber-100 text-amber-800",
};

export function ResourceCard({ resource }: { resource: CardResource }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-1.5">
        {resource.badges.map((b) => (
          <span
            key={b}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[b] ?? "bg-zinc-100 text-zinc-700"}`}
          >
            {b.replace(/_/g, " ")}
          </span>
        ))}
      </div>
      <h3 className="mt-2 font-semibold text-zinc-900">
        <Link href={`/resources/${resource.id}`} className="hover:underline">
          {resource.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-zinc-600">
        {[resource.className, resource.subjectName, resource.level, resource.type.replace(/_/g, " ")]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{resource.description}</p>
    </article>
  );
}
