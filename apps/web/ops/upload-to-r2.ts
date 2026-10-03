import * as fs from "node:fs";
import * as path from "node:path";
import mammoth from "mammoth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { EducationLevel, ResourceType, ReviewStatus } from "@prisma/client";
import { db } from "../src/lib/db";

const REPO = path.resolve(__dirname, "../../..");
const MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DRY = process.env.DRY_RUN === "1";

const TEACHER_DIRS = [
  { dir: "Basic 7 Oral Language", basic: 7, cls: "JHS 1", prefix: "B7", skip: [] as number[] },
  { dir: "Basic 8 Oral Language", basic: 8, cls: "JHS 2", prefix: "B8", skip: [] as number[] },
  { dir: "Basic 9 Oral Language", basic: 9, cls: "JHS 3", prefix: "B9", skip: [] as number[] },
];

const LEARNER_FILES = [
  {
    file: "Basic 7 Learner Resource/B7_English_Unit_Right_Words_Right_Place.docx",
    title: "Right Words, Right Place — Basic 7 Oral Language",
    description:
      "A full learner unit on formal and informal register: greetings, requests, " +
      "scene dialogues, the register-switch challenge, leveled practice and a star performance.",
    sourceRef: "Basic 7 Oral Language Lessons 1–2",
    basic: 7, cls: "JHS 1", topic: "Basic 7 Oral Language",
  },
  {
    file: "Basic 7 Learner Resource/JHS1_English_Learner_Textbook_Questions_That_Open_Conversations.docx",
    title: "Questions That Open Conversations — Basic 7 Oral Language",
    description:
      "Asking better questions from recall to extended thinking, with conversation " +
      "checklists, unit summary and self-assessment.",
    sourceRef: "Basic 7 Oral Language Lessons 1–2",
    basic: 7, cls: "JHS 1", topic: "Basic 7 Oral Language",
  },
  {
    file: "Basic 7 Learner Resource/B7_English_Unit_3_Rich_Oral_Descriptions.docx",
    title: "Rich Oral Descriptions — Basic 7 Oral Language",
    description:
      "Turn everyday experiences into vivid spoken descriptions: tenses, sentence variety, " +
      "figurative language and precise vocabulary.",
    sourceRef: "Basic 7 Oral Language Unit 3",
    basic: 7, cls: "JHS 1", topic: "Basic 7 Oral Language",
  },
  {
    file: "Basic 7 Learner Resource/B7_English_Unit_4_Giving_Clear_Directions.docx",
    title: "Giving Clear Directions — Basic 7 Oral Language",
    description:
      "Give directions so clearly a stranger can follow: directional vocabulary, command " +
      "structures, listening and checking.",
    sourceRef: "Basic 7 Oral Language Unit 4",
    basic: 7, cls: "JHS 1", topic: "Basic 7 Oral Language",
  },
];

function r2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET env vars");
  }
  return {
    client: new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } }),
    bucket,
  };
}

function cleanText(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

async function main() {
  const { client, bucket } = r2();
  const english = await db.subject.findFirstOrThrow({
    where: { level: EducationLevel.JHS, name: "English Language" },
  });
  const classes = await db.classLevel.findMany();
  const classByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));
  const topics = await db.topic.findMany({ where: { subjectId: english.id } });
  const topicByName = Object.fromEntries(topics.map((t) => [t.name, t.id]));

  let uploaded = 0;
  let skipped = 0;

  const put = async (key: string, localPath: string, mime: string): Promise<number> => {
    const data = fs.readFileSync(localPath);
    if (DRY) {
      console.log(`DRY ${key} (${data.byteLength} bytes)`);
      return data.byteLength;
    }
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mime }),
    );
    return data.byteLength;
  };

  // 1. Teacher lesson plans (deduped across folders by level+lesson number)
  const seen = new Set<string>();
  for (const d of TEACHER_DIRS) {
    const folder = path.join(REPO, d.dir);
    const files = fs
      .readdirSync(folder)
      .filter((f) => f.endsWith(".docx") && f.includes(`_${d.prefix}_`) && !f.startsWith("~$"))
      .sort((a, b) => {
        const na = parseInt(a.match(/Lesson(\d+)/)?.[1] ?? "0", 10);
        const nb = parseInt(b.match(/Lesson(\d+)/)?.[1] ?? "0", 10);
        return na - nb;
      });
    for (const file of files) {
      const num = file.match(/Lesson(\d+)/)?.[1] ?? "?";
      const dedupe = `${d.basic}:${num}`;
      if (seen.has(dedupe) || d.skip.includes(Number(num))) continue;
      seen.add(dedupe);

      const title = `Basic ${d.basic} English — Oral Language Lesson ${num}`;
      if (await db.resource.findFirst({ where: { title } })) {
        skipped++;
        continue;
      }
      let description = `Oral Language lesson ${num} for Basic ${d.basic} English. Full lesson plan document attached.`;
      try {
        const out = await mammoth.extractRawText({ path: path.join(folder, file) });
        const cleaned = cleanText(out.value);
        if (cleaned.length > 60) description = cleaned.slice(0, 400) + (cleaned.length > 400 ? "…" : "");
      } catch {
        // keep generic description
      }
      const key = `library/teacher/basic-${d.basic}/${file}`;
      const size = await put(key, path.join(folder, file), MIME);
      if (!DRY) {
        await db.resource.create({
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
            fileKey: key,
            fileSize: size,
            mimeType: MIME,
          },
        });
      }
      uploaded++;
      console.log(`OK ${title}`);
    }
  }

  // 2. Learner books
  for (const f of LEARNER_FILES) {
    if (await db.learnerLesson.findFirst({ where: { title: f.title } })) {
      skipped++;
      continue;
    }
    let bodyText = f.description;
    try {
      const out = await mammoth.extractRawText({ path: path.join(REPO, f.file) });
      const cleaned = cleanText(out.value);
      if (cleaned.length > 200) bodyText = cleaned;
    } catch {
      // keep hand-written description
    }
    const key = `library/learners/${path.basename(f.file)}`;
    const size = await put(key, path.join(REPO, f.file), MIME);
    if (!DRY) {
      await db.learnerLesson.create({
        data: {
          title: f.title,
          description: f.description,
          basicLevel: f.basic,
          classLevelId: classByName[f.cls],
          subjectId: english.id,
          topicId: topicByName[f.topic] ?? null,
          sourceRef: f.sourceRef,
          bodyText: bodyText.slice(0, 20000),
          fileKey: key,
          fileSize: size,
          mimeType: MIME,
          reviewStatus: ReviewStatus.APPROVED,
        },
      });
    }
    uploaded++;
    console.log(`OK ${f.title}`);
  }

  console.log(`R2_UPLOAD: ${uploaded} uploaded, ${skipped} already present${DRY ? " (dry run)" : ""}`);
  await db.$disconnect();
}

void main();
