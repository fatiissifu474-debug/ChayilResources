import { EducationLevel, ResourceType, ReviewStatus } from "@prisma/client";
import { db as prisma } from "../src/lib/db";

/**
 * Minimal curriculum skeleton proving the taxonomy end-to-end:
 * Level -> ClassLevel -> Subject -> Strand -> SubStrand -> Topic -> Resource
 */
async function main() {
  const ghana = await prisma.educationSystem.upsert({
    where: { country: "Ghana" },
    update: {},
    create: { id: "sys_ghana", country: "Ghana", name: "Ghana NaCCA" },
  });

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
      where: { systemId_level_name: { systemId: ghana.id, level: c.level, name: c.name } },
      update: {},
      create: { ...c, systemId: ghana.id },
    });
  }

  const jhs2 = await prisma.classLevel.findFirstOrThrow({
    where: { level: EducationLevel.JHS, name: "JHS 2", systemId: ghana.id },
  });

  const english = await prisma.subject.upsert({
    where: { systemId_level_name: { systemId: ghana.id, level: EducationLevel.JHS, name: "English Language" } },
    update: {},
    create: {
      name: "English Language",
      level: EducationLevel.JHS,
      systemId: ghana.id,
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

  // Idempotent helpers: rerunning the seed never duplicates content.
  const classByName: Record<string, string> = Object.fromEntries(
    (await prisma.classLevel.findMany({ where: { systemId: ghana.id } })).map((c) => [c.name, c.id]),
  );

  async function ensureSubject(name: string, level: EducationLevel, classNames: string[]) {
    return prisma.subject.upsert({
      where: { systemId_level_name: { systemId: ghana.id, level, name } },
      update: {},
      create: {
        name,
        level,
        systemId: ghana.id,
        classLevels: {
          connect: classNames
            .map((n) => classByName[n])
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
      },
    });
  }

  async function ensureTopic(
    name: string,
    subjectId: string,
    extra: { objectives?: string; classLevelId?: string } = {},
  ) {
    const existing = await prisma.topic.findFirst({ where: { name, subjectId } });
    if (existing) return existing;
    return prisma.topic.create({ data: { name, subjectId, ...extra } });
  }

  async function ensureResource(data: {
    title: string;
    description: string;
    type: ResourceType;
    level: EducationLevel;
    classLevelId?: string;
    subjectId?: string;
    author?: string;
    topicId?: string;
  }) {
    const existing = await prisma.resource.findFirst({ where: { title: data.title } });
    if (existing) return existing;
    const { topicId, ...rest } = data;
    return prisma.resource.create({
      data: {
        ...rest,
        copyrightHolder: "Chayil Resources (original sample)",
        permittedUse: "Classroom use, no redistribution",
        reviewStatus: ReviewStatus.APPROVED,
        badges: ["REVIEWED", "CURRICULUM_ALIGNED"],
        ...(topicId ? { topics: { create: [{ topicId }] } } : {}),
      },
    });
  }

  const topic = await ensureTopic("Reading comprehension", english.id, {
    objectives: "Learners read a passage and answer literal and inferential questions.",
    classLevelId: jhs2.id,
  });

  const lessonPlan = await ensureResource({
    title: "JHS 2 Reading Comprehension — Lesson Plan (Sample)",
    description: "Sample lesson plan: introduction, guided reading, group activity, assessment.",
    type: ResourceType.LESSON_PLAN,
    level: EducationLevel.JHS,
    classLevelId: jhs2.id,
    subjectId: english.id,
    author: "Chayil Resources",
    topicId: topic.id,
  });

  // --- Expanded library (Ghana) ---
  const maths = await ensureSubject("Mathematics", EducationLevel.JHS, ["JHS 1", "JHS 2", "JHS 3"]);
  const science = await ensureSubject("Science", EducationLevel.JHS, ["JHS 1", "JHS 2", "JHS 3"]);
  const engPrimary = await ensureSubject("English Language", EducationLevel.PRIMARY, ["Primary 4", "Primary 5", "Primary 6"]);
  const biology = await ensureSubject("Biology", EducationLevel.SHS, ["SHS 1"]);
  const electrical = await ensureSubject("Electrical Installation", EducationLevel.TVET, ["TVET Year 1"]);

  const fractions = await ensureTopic("Equivalent fractions", maths.id, {
    objectives: "Learners identify and generate equivalent fractions.",
    classLevelId: classByName["JHS 2"],
  });
  const wordProblems = await ensureTopic("Word problems", maths.id, { classLevelId: classByName["JHS 2"] });
  const photoJhs = await ensureTopic("Photosynthesis", science.id, { classLevelId: classByName["JHS 2"] });
  const fluency = await ensureTopic("Reading fluency", engPrimary.id, { classLevelId: classByName["Primary 4"] });
  const photoShs = await ensureTopic("Photosynthesis", biology.id, { classLevelId: classByName["SHS 1"] });
  const circuits = await ensureTopic("Basic circuits", electrical.id, { classLevelId: classByName["TVET Year 1"] });
  const speech = await ensureTopic("Parts of speech", english.id, { classLevelId: jhs2.id });

  const samples: Array<Parameters<typeof ensureResource>[0]> = [
    {
      title: "JHS 2 Equivalent Fractions — Worksheet",
      description: "Graded practice: shading, naming and generating equivalent fractions, with answer key.",
      type: ResourceType.WORKSHEET, level: EducationLevel.JHS,
      classLevelId: classByName["JHS 2"], subjectId: maths.id, topicId: fractions.id,
    },
    {
      title: "JHS 2 Word Problems — Assessment",
      description: "End-of-topic assessment: 10 fraction word problems with marking guide.",
      type: ResourceType.ASSESSMENT, level: EducationLevel.JHS,
      classLevelId: classByName["JHS 2"], subjectId: maths.id, topicId: wordProblems.id,
    },
    {
      title: "JHS Science Photosynthesis — Reading Material",
      description: "Learner-friendly reading on how green plants make food, with key terms.",
      type: ResourceType.READING_MATERIAL, level: EducationLevel.JHS,
      classLevelId: classByName["JHS 2"], subjectId: science.id, topicId: photoJhs.id,
    },
    {
      title: "Primary 4 Reading Fluency — Classroom Activity",
      description: "Paired repeated-reading activity with timing sheet for fluency practice.",
      type: ResourceType.CLASSROOM_ACTIVITY, level: EducationLevel.PRIMARY,
      classLevelId: classByName["Primary 4"], subjectId: engPrimary.id, topicId: fluency.id,
    },
    {
      title: "SHS 1 Photosynthesis — Revision Notes",
      description: "Concise WASSCE-oriented notes: stages, factors, equations, common exam traps.",
      type: ResourceType.REVISION_MATERIAL, level: EducationLevel.SHS,
      classLevelId: classByName["SHS 1"], subjectId: biology.id, topicId: photoShs.id,
    },
    {
      title: "TVET Electrical Circuits — Practical Activity",
      description: "Hands-on activity: building series and parallel circuits with safety checklist.",
      type: ResourceType.PRACTICAL_ACTIVITY, level: EducationLevel.TVET,
      classLevelId: classByName["TVET Year 1"], subjectId: electrical.id, topicId: circuits.id,
    },
    {
      title: "JHS 2 Parts of Speech — Quiz",
      description: "15-question quiz on nouns, verbs, adjectives and adverbs in context.",
      type: ResourceType.QUIZ, level: EducationLevel.JHS,
      classLevelId: jhs2.id, subjectId: english.id, topicId: speech.id,
    },
    {
      title: "Think-Pair-Share — Teaching Strategy",
      description: "What it is: structured pair discussion. Why it matters: every learner thinks and speaks. How to use it: pose, think (1 min), pair, share. Example: JHS Mathematics — which is larger, 2/3 or 3/4? Defend your answer.",
      type: ResourceType.TEACHING_STRATEGY, level: EducationLevel.JHS,
    },
  ];

  for (const s of samples) {
    await ensureResource(s);
  }

  console.log(`Seeded: JHS 2 English chain + resource ${lessonPlan.id} (+${samples.length} library samples)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
