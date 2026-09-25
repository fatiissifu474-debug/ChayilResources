import { EducationLevel, ResourceType, ReviewStatus } from "@prisma/client";
import { db as prisma } from "../src/lib/db";

/**
 * Minimal curriculum skeleton proving the taxonomy end-to-end:
 * Level -> ClassLevel -> Subject -> Strand -> SubStrand -> Topic -> Resource
 */
async function main() {
  const classNames: Array<{ level: EducationLevel; name: string; position: number }> = [
    ...[1, 2, 3, 4, 5, 6].map((n) => ({
      level: EducationLevel.PRIMARY as EducationLevel,
      name: `Primary ${n}`,
      position: n,
    })),
    ...[1, 2, 3].map((n) => ({
      level: EducationLevel.JHS as EducationLevel,
      name: `JHS ${n}`,
      position: n,
    })),
    ...[1, 2, 3].map((n) => ({
      level: EducationLevel.SHS as EducationLevel,
      name: `SHS ${n}`,
      position: n,
    })),
    ...[1, 2, 3].map((n) => ({
      level: EducationLevel.TVET as EducationLevel,
      name: `TVET Year ${n}`,
      position: n,
    })),
  ];

  for (const c of classNames) {
    await prisma.classLevel.upsert({
      where: { level_name: { level: c.level, name: c.name } },
      update: {},
      create: c,
    });
  }

  const jhs2 = await prisma.classLevel.findFirstOrThrow({
    where: { level: EducationLevel.JHS, name: "JHS 2" },
  });

  const english = await prisma.subject.upsert({
    where: { level_name: { level: EducationLevel.JHS, name: "English Language" } },
    update: {},
    create: {
      name: "English Language",
      level: EducationLevel.JHS,
      classLevels: { connect: [{ id: jhs2.id }] },
    },
  });

  const reading = await prisma.strand.upsert({
    where: { subjectId_name: { subjectId: english.id, name: "Reading" } },
    update: {},
    create: { name: "Reading", subjectId: english.id },
  });

  const comprehension = await prisma.subStrand.upsert({
    where: { strandId_name: { strandId: reading.id, name: "Comprehension" } },
    update: {},
    create: { name: "Comprehension", strandId: reading.id },
  });

  const topic = await prisma.topic.create({
    data: {
      name: "Reading comprehension",
      objectives: "Learners read a passage and answer literal and inferential questions.",
      subjectId: english.id,
      subStrandId: comprehension.id,
      classLevelId: jhs2.id,
    },
  });

  const lessonPlan = await prisma.resource.create({
    data: {
      title: "JHS 2 Reading Comprehension — Lesson Plan (Sample)",
      description: "Sample lesson plan: introduction, guided reading, group activity, assessment.",
      type: ResourceType.LESSON_PLAN,
      fileKey: null,
      author: "Chayil Resources",
      copyrightHolder: "Chayil Resources (original sample)",
      permittedUse: "Classroom use, no redistribution",
      reviewStatus: ReviewStatus.APPROVED,
      badges: ["REVIEWED", "CURRICULUM_ALIGNED"],
      level: EducationLevel.JHS,
      classLevelId: jhs2.id,
      subjectId: english.id,
      topics: { create: [{ topicId: topic.id }] },
    },
  });

  console.log(`Seeded: JHS 2 English chain + resource ${lessonPlan.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
