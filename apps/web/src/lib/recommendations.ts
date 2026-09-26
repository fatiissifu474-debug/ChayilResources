import { db } from "./db";
import { EducationLevel } from "@prisma/client";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  badges: string[];
  subjectName: string | null;
  className: string | null;
  reasons: string[];
}

/**
 * Improved recommendations (PRD §13/§31): scores approved resources against
 * the teacher's profile (levels, subjects), saved resources (subjects, topics),
 * recently viewed subjects, recent search terms, and recency.
 * Already-saved resources are never recommended.
 */
export async function getRecommendations(userId: string, limit = 6): Promise<Recommendation[]> {
  const profile = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const levels = profile.teachingLevels as EducationLevel[];

  const [saved, views, searches] = await Promise.all([
    db.savedResource.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        resource: {
          include: { subject: true, topics: { include: { topic: true } } },
        },
      },
    }),
    db.viewLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { resource: { include: { subject: true } } },
    }),
    db.searchLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const savedIds = new Set(saved.map((s) => s.resource.id));
  const savedSubjects = new Set(
    saved.flatMap((s) => (s.resource.subject ? [s.resource.subject.name] : [])),
  );
  const savedTopics = new Set(
    saved.flatMap((s) => s.resource.topics.map((t) => t.topic.name.toLowerCase())),
  );
  const viewedSubjects = views.flatMap((v) => (v.resource.subject ? [v.resource.subject.name] : []));
  const termSet = new Set(
    searches.flatMap((s) =>
      s.query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3),
    ),
  );

  const candidates = await db.resource.findMany({
    where: {
      reviewStatus: "APPROVED",
      ...(levels.length > 0 ? { level: { in: levels } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { subject: true, classLevel: true, topics: { include: { topic: true } } },
  });

  const scored = candidates
    .filter((c) => !savedIds.has(c.id))
    .map((c) => {
      let score = 0;
      const reasons: string[] = [];
      const subj = c.subject?.name ?? null;

      if (subj && profile.subjects.includes(subj)) {
        score += 5;
        reasons.push(`Matches your subject: ${subj}`);
      }
      if (subj && savedSubjects.has(subj)) {
        score += 4;
        reasons.push(`More like your saved ${subj} resources`);
      }
      const cTopics = c.topics.map((t) => t.topic.name.toLowerCase());
      if (cTopics.some((t) => savedTopics.has(t))) {
        score += 3;
        reasons.push("Builds on a topic you saved");
      }
      if (subj && viewedSubjects.includes(subj)) {
        score += 2;
        reasons.push(`You recently viewed ${subj}`);
      }
      const haystack = `${c.title} ${c.description} ${subj ?? ""}`.toLowerCase();
      const hit = [...termSet].find((t) => haystack.includes(t));
      if (hit) {
        score += 3;
        reasons.push(`Matches your search: “${hit}”`);
      }
      if (Date.now() - c.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000) {
        score += 1;
        reasons.push("Recently added");
      }
      return { c, score, reasons: reasons.slice(0, 2) };
    });

  scored.sort((a, b) => b.score - a.score || b.c.createdAt.getTime() - a.c.createdAt.getTime());

  return scored.slice(0, limit).map(({ c, reasons }) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type,
    level: c.level,
    badges: c.badges,
    subjectName: c.subject?.name ?? null,
    className: c.classLevel?.name ?? null,
    reasons,
  }));
}
