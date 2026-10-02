import * as fs from "node:fs";
import * as path from "node:path";
import mammoth from "mammoth";
import { EducationLevel, ResourceType, ReviewStatus } from "@prisma/client";
import { db } from "../src/lib/db";

const REPO = path.resolve(__dirname, "../..");
const STORAGE = path.resolve(process.env.STORAGE_DIR ?? "./storage");
const MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const DIRS = [
  { dir: "Basic 7 Oral Language", basic: 7, cls: "JHS 1", prefix: "B7" },
  { dir: "Basic 8 Oral Language", basic: 8, cls: "JHS 2", prefix: "B8" },
  { dir: "Basic 9 Oral Language", basic: 9, cls: "JHS 3", prefix: "B9" },
];

function cleanText(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

async function main() {
  const english = await db.subject.findFirstOrThrow({
    where: { level: EducationLevel.JHS, name: "English Language" },
  });
  const classes = await db.classLevel.findMany({ where: { level: EducationLevel.JHS } });
  const classByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));
  const topics = await db.topic.findMany({ where: { subjectId: english.id } });
  const topicByName = Object.fromEntries(topics.map((t) => [t.name, t.id]));

  let created = 0;
  let skipped = 0;

  for (const d of DIRS) {
    const folder = path.join(REPO, d.dir);
    const files = fs
      .readdirSync(folder)
      .filter((f) => f.endsWith(".docx") && f.includes(`_${d.prefix}_`))
      .sort((a, b) => {
        const na = parseInt(a.match(/Lesson(\d+)/)?.[1] ?? "0", 10);
        const nb = parseInt(b.match(/Lesson(\d+)/)?.[1] ?? "0", 10);
        return na - nb;
      });

    for (const file of files) {
      const num = file.match(/Lesson(\d+)/)?.[1] ?? "?";
      const title = `Basic ${d.basic} English — Oral Language Lesson ${num}`;
      const existing = await db.resource.findFirst({ where: { title } });
      if (existing) {
        skipped++;
        continue;
      }

      let description = `Oral Language lesson ${num} for Basic ${d.basic} English. Full lesson plan document attached.`;
      try {
        const out = await mammoth.extractRawText({ path: path.join(folder, file) });
        const cleaned = cleanText(out.value);
        if (cleaned.length > 60) {
          description = cleaned.slice(0, 400) + (cleaned.length > 400 ? "…" : "");
        }
      } catch {
        // keep generic description
      }

      const resource = await db.resource.create({
        data: {
          title,
          description,
          type: ResourceType.LESSON_PLAN,
          level: EducationLevel.JHS,
          classLevelId: classByName[d.cls],
          subjectId: english.id,
          author: "Chayil Resources",
          copyrightHolder: "Chayil Resources",
          permittedUse: "Classroom use, no redistribution",
          reviewStatus: ReviewStatus.APPROVED,
          badges: ["REVIEWED", "CURRICULUM_ALIGNED"],
          topics: { create: [{ topicId: topicByName[`Basic ${d.basic} Oral Language`] }] },
        },
      });

      try {
        const destDir = path.join(STORAGE, "resources", resource.id);
        fs.mkdirSync(destDir, { recursive: true });
        const dest = path.join(destDir, file);
        fs.copyFileSync(path.join(folder, file), dest);
        const size = fs.statSync(dest).size;
        await db.resource.update({
          where: { id: resource.id },
          data: { fileKey: `resources/${resource.id}/${file}`, fileSize: size, mimeType: MIME },
        });
        created++;
        console.log(`OK ${title} (${size} bytes)`);
      } catch (e) {
        await db.resource.delete({ where: { id: resource.id } }).catch(() => {});
        console.log(`FAIL ${title}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  console.log(`INGEST: ${created} created, ${skipped} already present`);
  await db.$disconnect();
}

void main();
