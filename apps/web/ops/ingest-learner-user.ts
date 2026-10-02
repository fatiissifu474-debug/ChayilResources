import * as fs from "node:fs";
import * as path from "node:path";
import mammoth from "mammoth";
import { EducationLevel, ReviewStatus } from "@prisma/client";
import { db } from "../src/lib/db";

const REPO = path.resolve(__dirname, "../../..");
const STORAGE = path.resolve(process.env.STORAGE_DIR ?? "./storage");
const MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const FILES = [
  {
    file: "Basic 7 Learner Resource/B7_English_Unit_Right_Words_Right_Place.docx",
    title: "Right Words, Right Place — Basic 7 Oral Language",
    description:
      "A full learner unit on formal and informal register: greetings, requests, " +
      "scene dialogues, the register-switch challenge, leveled practice and a star performance.",
    sourceRef: "Basic 7 Oral Language Lessons 1–2",
    cls: "JHS 1",
    basicLevel: 7,
    topicName: "Basic 7 Oral Language",
  },
  {
    file: "Basic 7 Learner Resource/JHS1_English_Learner_Textbook_Questions_That_Open_Conversations.docx",
    title: "Questions That Open Conversations — Basic 7 Oral Language",
    description:
      "Asking better questions from recall to extended thinking, with conversation " +
      "checklists, unit summary and self-assessment.",
    sourceRef: "Basic 7 Oral Language Lessons 1–2",
    cls: "JHS 1",
    basicLevel: 7,
    topicName: "Basic 7 Oral Language",
  },
];

/** Ingest the two contributor-built learner books (idempotent by title). */
async function main() {
  const english = await db.subject.findFirstOrThrow({
    where: { level: EducationLevel.JHS, name: "English Language" },
  });
  const classes = await db.classLevel.findMany({ where: { level: EducationLevel.JHS } });
  const classByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));
  const topics = await db.topic.findMany({ where: { subjectId: english.id } });
  const topicByName = Object.fromEntries(topics.map((t) => [t.name, t.id]));

  let created = 0;
  for (const f of FILES) {
    const existing = await db.learnerLesson.findFirst({ where: { title: f.title } });
    if (existing) {
      console.log(`SKIP ${f.title}`);
      continue;
    }
    const src = path.join(REPO, f.file);
    let bodyText = f.description;
    try {
      const out = await mammoth.extractRawText({ path: src });
      const cleaned = out.value.replace(/\s+/g, " ").trim();
      if (cleaned.length > 200) bodyText = cleaned;
    } catch {
      // keep hand-written description
    }

    const row = await db.learnerLesson.create({
      data: {
        title: f.title,
        description: f.description,
        basicLevel: f.basicLevel,
        classLevelId: classByName[f.cls],
        subjectId: english.id,
        topicId: topicByName[f.topicName] ?? null,
        sourceRef: f.sourceRef,
        bodyText,
        reviewStatus: ReviewStatus.APPROVED,
      },
    });

    const destDir = path.join(STORAGE, "learner-lessons", row.id);
    fs.mkdirSync(destDir, { recursive: true });
    const base = path.basename(src);
    fs.copyFileSync(src, path.join(destDir, base));
    const size = fs.statSync(path.join(destDir, base)).size;
    await db.learnerLesson.update({
      where: { id: row.id },
      data: { fileKey: `learner-lessons/${row.id}/${base}`, fileSize: size, mimeType: MIME },
    });
    created++;
    console.log(`OK ${f.title} (${size} bytes)`);
  }

  console.log(`INGEST-USER: ${created} created`);
  await db.$disconnect();
}

void main();
