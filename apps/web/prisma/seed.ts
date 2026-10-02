import { EducationLevel } from "@prisma/client";
import { db as prisma } from "../src/lib/db";

/**
 * Curriculum structure seed (idempotent, safe to rerun):
 * Ghana > Primary 1-6 + JHS 1-3 > 14 subjects > English strands > Oral Language topics.
 * Real lesson content is ingested separately via ops/ingest-lessons.ts
 * (source files live in the repo's "Basic N Oral Language" folders).
 */
const PRIMARY = ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
const JHS = ["JHS 1", "JHS 2", "JHS 3"];
const STRANDS = ["Oral Language", "Reading", "Grammar", "Writing/Composition", "Literature"];

const SUBJECTS: Array<{ name: string; level: EducationLevel; classes: string[] }> = [
  { name: "English Language", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "Maths", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "Science", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "RME", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "Computing/ICT", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "Our World Our People", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "Creative Arts", level: EducationLevel.PRIMARY, classes: PRIMARY },
  { name: "English Language", level: EducationLevel.JHS, classes: JHS },
  { name: "Maths", level: EducationLevel.JHS, classes: JHS },
  { name: "Science", level: EducationLevel.JHS, classes: JHS },
  { name: "RME", level: EducationLevel.JHS, classes: JHS },
  { name: "Computing/ICT", level: EducationLevel.JHS, classes: JHS },
  { name: "Social Studies", level: EducationLevel.JHS, classes: JHS },
  { name: "Career Technology", level: EducationLevel.JHS, classes: JHS },
];

const ORAL_TOPICS = [
  { name: "Basic 7 Oral Language", cls: "JHS 1" },
  { name: "Basic 8 Oral Language", cls: "JHS 2" },
  { name: "Basic 9 Oral Language", cls: "JHS 3" },
];

async function main() {
  const ghana = await prisma.educationSystem.upsert({
    where: { country: "Ghana" },
    update: {},
    create: { id: "sys_ghana", country: "Ghana", name: "Ghana NaCCA" },
  });

  const classByName: Record<string, string> = Object.fromEntries(
    (
      await Promise.all(
        [...PRIMARY.map((name) => ({ level: EducationLevel.PRIMARY as EducationLevel, name })),
          ...JHS.map((name) => ({ level: EducationLevel.JHS as EducationLevel, name })),
        ].map((c, i) =>
          prisma.classLevel.upsert({
            where: { systemId_level_name: { systemId: ghana.id, level: c.level, name: c.name } },
            update: {},
            create: { ...c, position: (i % 6) + 1, systemId: ghana.id },
          }),
        ),
      )
    ).map((c) => [c.name, c.id]),
  );

  const subjIds: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const r = await prisma.subject.upsert({
      where: { systemId_level_name: { systemId: ghana.id, level: s.level, name: s.name } },
      update: {},
      create: {
        name: s.name,
        level: s.level,
        systemId: ghana.id,
        classLevels: { connect: s.classes.map((n) => ({ id: classByName[n] })) },
      },
    });
    subjIds[`${s.level}:${s.name}`] = r.id;
  }

  for (const key of ["PRIMARY:English Language", "JHS:English Language"]) {
    for (const name of STRANDS) {
      await prisma.strand.upsert({
        where: { subjectId_name: { subjectId: subjIds[key], name } },
        update: {},
        create: { name, subjectId: subjIds[key] },
      });
    }
  }

  for (const t of ORAL_TOPICS) {
    const existing = await prisma.topic.findFirst({
      where: { name: t.name, subjectId: subjIds["JHS:English Language"] },
    });
    if (!existing) {
      await prisma.topic.create({
        data: {
          name: t.name,
          objectives: `${t.name}: spoken English lessons.`,
          subjectId: subjIds["JHS:English Language"],
          classLevelId: classByName[t.cls],
        },
      });
    }
  }

  const [classes, subjects, strands, topics] = await Promise.all([
    prisma.classLevel.count(),
    prisma.subject.count(),
    prisma.strand.count(),
    prisma.topic.count(),
  ]);
  console.log(`Seeded structure: ${classes} classes, ${subjects} subjects, ${strands} strands, ${topics} topics`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
