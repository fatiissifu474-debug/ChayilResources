import * as fs from "node:fs";
import * as path from "node:path";
import { EducationLevel, ReviewStatus } from "@prisma/client";
import { db } from "../src/lib/db";

const REPO = path.resolve(__dirname, "../../..");
const STORAGE = path.resolve(process.env.STORAGE_DIR ?? "./storage");
const MANIFEST = "C:\\Users\\David\\AppData\\Local\\Temp\\learner-manifest.json";
const MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DIR_FOR: Record<number, string> = {
  7: "Basic 7 Learner Resource",
  8: "Basic 8 Learner Resource",
  9: "Basic 9 Learner Resource",
};

const asArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const asStr = (v: unknown): string => (typeof v === "string" ? v : "");

/** Flatten a generated unit to plain reading text for on-screen study. */
function toBodyText(u: Record<string, unknown>): string {
  const parts: string[] = [];
  const push = (s: string): void => {
    if (s.trim()) parts.push(s.trim());
  };
  push(asStr(u.welcome));
  push("What You Will Learn");
  asArr(u.objectives).forEach(push);
  const kw = (u.keyWords ?? u.keywords) as Array<{ word?: unknown; meaning?: unknown }> | undefined;
  if (Array.isArray(kw)) {
    push("Key Words");
    kw.forEach((k) => push(`${asStr(k.word)} — ${asStr(k.meaning)}`));
  }
  asArr(u.remember).forEach(push);
  push(asStr(u.howToUse));
  const secs = u.sections as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(secs)) {
    for (const s of secs) {
      const o = typeof s === "string" ? {} : s;
      push(asStr(o.heading));
      asArr(o.paragraphs).forEach(push);
      asArr(o.bullets).forEach((b) => push(`• ${b}`));
      const t = o.table as { headers?: unknown; rows?: unknown } | undefined;
      if (t && Array.isArray(t.headers)) {
        push(asArr(t.headers).join(" | "));
        if (Array.isArray(t.rows)) {
          (t.rows as unknown[]).forEach((r) => push(asArr(r).join(" | ")));
        }
      }
      const co = o.callout as { title?: unknown; body?: unknown } | undefined;
      if (co) push(`${asStr(co.title)}: ${asStr(co.body)}`);
    }
  }
  const tog = u.together as Record<string, unknown> | undefined;
  if (tog) {
    push(asStr(tog.title));
    push(asStr(tog.intro));
    asArr(tog.steps).forEach(push);
  }
  const solo = u.solo as { levels?: Array<{ name?: unknown; tasks?: unknown }> } | undefined;
  if (solo && Array.isArray(solo.levels)) {
    push("Practise on Your Own");
    solo.levels.forEach((lv) => {
      push(asStr(lv.name));
      asArr(lv.tasks).forEach(push);
    });
  }
  const check = u.check as { partA?: unknown; partB?: unknown } | undefined;
  if (check) {
    push("Check What You Have Learned");
    asArr(check.partA).forEach(push);
    asArr(check.partB).forEach(push);
  }
  const show = u.show as { task?: unknown; checklist?: unknown } | undefined;
  if (show) {
    push("Show What You Know");
    push(asStr(show.task));
    asArr(show.checklist).forEach(push);
  }
  push(asStr(u.summary));
  push(asStr(u.lookAhead));
  return parts.join("\n\n");
}

/** Ingest the 27 generated learner books (idempotent by title). */
async function main() {
  const english = await db.subject.findFirstOrThrow({
    where: { level: EducationLevel.JHS, name: "English Language" },
  });
  const classes = await db.classLevel.findMany({ where: { level: EducationLevel.JHS } });
  const classByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));
  const topics = await db.topic.findMany({ where: { subjectId: english.id } });
  const topicByName = Object.fromEntries(topics.map((t) => [t.name, t.id]));
  const clsFor: Record<number, string> = { 7: "JHS 1", 8: "JHS 2", 9: "JHS 3" };

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Array<Record<string, unknown>>;
  let created = 0;
  let skipped = 0;

  for (const m of manifest) {
    if (m.failed || !m.unit) {
      console.log(`SKIP failed basic ${m.basic} lesson ${m.num}`);
      continue;
    }
    const basic = m.basic as number;
    const num = m.num as number;
    const title = `Basic ${basic} English — Oral Language Lesson ${num}`;
    const existing = await db.learnerLesson.findFirst({ where: { title } });
    if (existing) {
      skipped++;
      continue;
    }
    const u = m.unit as Record<string, unknown>;
    const filename = `Learner_B${basic}_English_Lesson${num}.docx`;
    const src = path.join(REPO, DIR_FOR[basic], filename);
    if (!fs.existsSync(src)) {
      console.log(`MISSING FILE ${filename}`);
      continue;
    }

    const row = await db.learnerLesson.create({
      data: {
        title,
        description: `${asStr((u as { unitTitle?: unknown }).unitTitle) || title}. ${asStr(u.welcome).slice(0, 220)}`,
        basicLevel: basic,
        classLevelId: classByName[clsFor[basic]],
        subjectId: english.id,
        topicId: topicByName[`Basic ${basic} Oral Language`] ?? null,
        sourceRef: `Basic ${basic} Oral Language Lesson ${num}`,
        bodyText: toBodyText(u).slice(0, 20000),
        reviewStatus: ReviewStatus.APPROVED,
      },
    });

    try {
      const destDir = path.join(STORAGE, "learner-lessons", row.id);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, filename));
      const size = fs.statSync(path.join(destDir, filename)).size;
      await db.learnerLesson.update({
        where: { id: row.id },
        data: { fileKey: `learner-lessons/${row.id}/${filename}`, fileSize: size, mimeType: MIME },
      });
      created++;
      console.log(`OK ${title}`);
    } catch (e) {
      await db.learnerLesson.delete({ where: { id: row.id } }).catch(() => {});
      console.log(`FAIL ${title}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`INGEST-GEN: ${created} created, ${skipped} already present`);
  await db.$disconnect();
}

void main();
