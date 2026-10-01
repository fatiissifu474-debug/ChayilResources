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

  // --- Pilot content wave (idempotent): breadth across every level ---
  const batchSubjects = [
    { name: "English Language", level: EducationLevel.SHS, classes: ["SHS 1", "SHS 2", "SHS 3"] },
    { name: "Mathematics", level: EducationLevel.SHS, classes: ["SHS 1"] },
    { name: "Mathematics", level: EducationLevel.PRIMARY, classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
    { name: "Science", level: EducationLevel.PRIMARY, classes: ["Primary 4", "Primary 5", "Primary 6"] },
    { name: "Social Studies", level: EducationLevel.JHS, classes: ["JHS 1", "JHS 2", "JHS 3"] },
  ];
  const subjIds: Record<string, string> = {
    [`${EducationLevel.JHS}:Mathematics`]: maths.id,
    [`${EducationLevel.JHS}:Science`]: science.id,
    [`${EducationLevel.PRIMARY}:English Language`]: engPrimary.id,
    [`${EducationLevel.SHS}:Biology`]: biology.id,
    [`${EducationLevel.TVET}:Electrical Installation`]: electrical.id,
    [`${EducationLevel.JHS}:English Language`]: english.id,
  };
  for (const s of batchSubjects) {
    const r = await ensureSubject(s.name, s.level, s.classes);
    subjIds[`${s.level}:${s.name}`] = r.id;
  }

  const batchTopics: Array<{ name: string; subj: string; cls: string; objectives?: string }> = [
    { name: "Ratios and proportion", subj: "JHS:Mathematics", cls: "JHS 2" },
    { name: "Integers", subj: "JHS:Mathematics", cls: "JHS 1" },
    { name: "Forces and motion", subj: "JHS:Science", cls: "JHS 1" },
    { name: "Summary writing", subj: "JHS:English Language", cls: "JHS 3" },
    { name: "Phonics basics", subj: "PRIMARY:English Language", cls: "Primary 1" },
    { name: "Number bonds", subj: "PRIMARY:Mathematics", cls: "Primary 2" },
    { name: "Living things", subj: "PRIMARY:Science", cls: "Primary 5" },
    { name: "Comprehension", subj: "SHS:English Language", cls: "SHS 1" },
    { name: "Quadratic equations", subj: "SHS:Mathematics", cls: "SHS 1" },
    { name: "Cell structure", subj: "SHS:Biology", cls: "SHS 1" },
    { name: "Electrical safety", subj: "TVET:Electrical Installation", cls: "TVET Year 1" },
    { name: "Our nation Ghana", subj: "JHS:Social Studies", cls: "JHS 1" },
  ];
  const topicIds: Record<string, string> = {};
  for (const t of batchTopics) {
    const r = await ensureTopic(t.name, subjIds[t.subj], { objectives: t.objectives, classLevelId: classByName[t.cls] });
    topicIds[`${t.subj}:${t.name}`] = r.id;
  }

  type Res = Parameters<typeof ensureResource>[0];
  const R = (
    title: string, description: string, type: ResourceType, level: EducationLevel,
    cls: string, subj: string, topic?: string,
  ): Res => ({
    title, description, type, level,
    classLevelId: classByName[cls], subjectId: subjIds[subj],
    ...(topic ? { topicId: topicIds[`${subj}:${topic}`] } : {}),
  });

  const wave: Res[] = [
    R("JHS 2 Ratios and Proportion — Lesson Plan", "Concept building with market examples, practice sets and plenary.", ResourceType.LESSON_PLAN, EducationLevel.JHS, "JHS 2", "JHS:Mathematics", "Ratios and proportion"),
    R("JHS 2 Ratios Practice — Worksheet", "30 graded ratio problems with answer key.", ResourceType.WORKSHEET, EducationLevel.JHS, "JHS 2", "JHS:Mathematics", "Ratios and proportion"),
    R("JHS 1 Integers — Quiz", "Ordering, adding and subtracting integers; 12 questions.", ResourceType.QUIZ, EducationLevel.JHS, "JHS 1", "JHS:Mathematics", "Integers"),
    R("JHS 1 Forces and Motion — Worksheet", "Push/pull sorting, friction experiments on paper, key terms.", ResourceType.WORKSHEET, EducationLevel.JHS, "JHS 1", "JHS:Science", "Forces and motion"),
    R("JHS 1 Forces and Motion — Quiz", "10 questions with diagrams described in words.", ResourceType.QUIZ, EducationLevel.JHS, "JHS 1", "JHS:Science", "Forces and motion"),
    R("JHS 3 Summary Writing — Teacher Guide", "Step-by-step approach to BECE summary passages with worked example.", ResourceType.TEACHER_GUIDE, EducationLevel.JHS, "JHS 3", "JHS:English Language", "Summary writing"),
    R("JHS 3 Summary Practice — Worksheet", "Two passages with length-constrained summary tasks.", ResourceType.WORKSHEET, EducationLevel.JHS, "JHS 3", "JHS:English Language", "Summary writing"),
    R("Primary 1 Phonics Basics — Classroom Activity", "Letter-sound games with locally available materials.", ResourceType.CLASSROOM_ACTIVITY, EducationLevel.PRIMARY, "Primary 1", "PRIMARY:English Language", "Phonics basics"),
    R("Primary 1 Phonics Wall Chart", "Printable sound chart: single letters and common blends.", ResourceType.POSTER, EducationLevel.PRIMARY, "Primary 1", "PRIMARY:English Language", "Phonics basics"),
    R("Primary 2 Number Bonds — Worksheet", "Bonds to 10 and 20 with visual ten-frames.", ResourceType.WORKSHEET, EducationLevel.PRIMARY, "Primary 2", "PRIMARY:Mathematics", "Number bonds"),
    R("Primary 2 Number Bonds — Quiz", "Quick oral and written check for fluency.", ResourceType.QUIZ, EducationLevel.PRIMARY, "Primary 2", "PRIMARY:Mathematics", "Number bonds"),
    R("Primary 5 Living Things — Reading Material", "Plants, animals and habitats around the school compound.", ResourceType.READING_MATERIAL, EducationLevel.PRIMARY, "Primary 5", "PRIMARY:Science", "Living things"),
    R("Primary 5 Living Things — Practical Activity", "School-ground observation walk with recording sheet.", ResourceType.PRACTICAL_ACTIVITY, EducationLevel.PRIMARY, "Primary 5", "PRIMARY:Science", "Living things"),
    R("SHS 1 Comprehension — Exam Preparation", "Two WASSCE-style passages with timed practice and model answers.", ResourceType.EXAM_PREP, EducationLevel.SHS, "SHS 1", "SHS:English Language", "Comprehension"),
    R("SHS 1 Comprehension Strategies — Teacher Guide", "Skimming, scanning and inference techniques for long passages.", ResourceType.TEACHER_GUIDE, EducationLevel.SHS, "SHS 1", "SHS:English Language", "Comprehension"),
    R("SHS 1 Quadratic Equations — Lesson Plan", "Factorization and formula methods over two periods.", ResourceType.LESSON_PLAN, EducationLevel.SHS, "SHS 1", "SHS:Mathematics", "Quadratic equations"),
    R("SHS 1 Quadratics — Revision Material", "Formula sheet, worked examples and past-question drills.", ResourceType.REVISION_MATERIAL, EducationLevel.SHS, "SHS 1", "SHS:Mathematics", "Quadratic equations"),
    R("SHS 1 Cell Structure — Diagram Pack", "Labelled plant and animal cell diagrams with blank versions for testing.", ResourceType.DIAGRAM, EducationLevel.SHS, "SHS 1", "SHS:Biology", "Cell structure"),
    R("SHS 1 Cell Structure — Revision Notes", "Organelles, functions and comparison table for exams.", ResourceType.REVISION_MATERIAL, EducationLevel.SHS, "SHS 1", "SHS:Biology", "Cell structure"),
    R("TVET Electrical Safety — Teacher Guide", "Workshop safety rules, PPE and emergency procedures.", ResourceType.TEACHER_GUIDE, EducationLevel.TVET, "TVET Year 1", "TVET:Electrical Installation", "Electrical safety"),
    R("TVET Electrical Safety — Assessment", "Safety certification quiz with pass mark and remediation notes.", ResourceType.ASSESSMENT, EducationLevel.TVET, "TVET Year 1", "TVET:Electrical Installation", "Electrical safety"),
    R("JHS 1 Our Nation Ghana — Reading Material", "Regions, culture and civic values in simple language.", ResourceType.READING_MATERIAL, EducationLevel.JHS, "JHS 1", "JHS:Social Studies", "Our nation Ghana"),
    R("JHS 1 Our Nation Ghana — Worksheet", "Map labelling and short-answer civic questions.", ResourceType.WORKSHEET, EducationLevel.JHS, "JHS 1", "JHS:Social Studies", "Our nation Ghana"),
    R("JHS 3 BECE Mathematics Mock", "Full 60-question mock with marking scheme and topic map.", ResourceType.EXAM_PREP, EducationLevel.JHS, "JHS 3", "JHS:Mathematics"),
    R("SHS 1 Biology Mid-Term Assessment", "Theory + objective sections with marking guide.", ResourceType.ASSESSMENT, EducationLevel.SHS, "SHS 1", "SHS:Biology"),
    R("Primary 5 Science Reader (Sample)", "Short illustrated passages for class reading corners.", ResourceType.READING_MATERIAL, EducationLevel.PRIMARY, "Primary 5", "PRIMARY:Science"),
    R("Exit Tickets — Teaching Strategy", "What it is: 2-minute end-of-lesson checks. Why it matters: every learner shows understanding. How to use it: one question on a slip, sort into got-it / wobbly / lost piles. Example: Primary Mathematics — write one number bond to 20.",
      ResourceType.TEACHING_STRATEGY, EducationLevel.PRIMARY, "Primary 2", "PRIMARY:Mathematics"),
    R("Cold Calling — Teaching Strategy", "What it is: directed questioning. Why it matters: keeps all learners alert. How to use it: pose, pause, name, respond. Example: SHS Biology — Ama, name one function of the cell membrane.",
      ResourceType.TEACHING_STRATEGY, EducationLevel.SHS, "SHS 1", "SHS:Biology"),
  ];

  for (const w of wave) {
    await ensureResource(w);
  }

  console.log(`Seeded: JHS 2 English chain + resource ${lessonPlan.id} (+${samples.length + wave.length} library samples)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
