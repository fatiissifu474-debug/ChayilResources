import { EducationLevel } from "@prisma/client";
import { db } from "../src/lib/db";

const PRIMARY = ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
const JHS = ["JHS 1", "JHS 2", "JHS 3"];
const STRANDS = ["Oral Language", "Reading", "Grammar", "Writing/Composition", "Literature"];

async function main() {
  await db.$executeRaw`update subject set name='Maths' where name='Mathematics'`;

  const classByName: Record<string, string> = Object.fromEntries(
    (await db.classLevel.findMany()).map((c) => [c.name, c.id]),
  );

  const defs: Array<{ name: string; level: EducationLevel; classes: string[] }> = [
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

  const ghana = await db.educationSystem.findUniqueOrThrow({ where: { country: "Ghana" } });
  const subjIds: Record<string, string> = {};
  for (const d of defs) {
    const s = await db.subject.upsert({
      where: { systemId_level_name: { systemId: ghana.id, level: d.level, name: d.name } },
      update: {},
      create: {
        name: d.name,
        level: d.level,
        systemId: ghana.id,
        classLevels: { connect: d.classes.map((n) => ({ id: classByName[n] })) },
      },
    });
    subjIds[`${d.level}:${d.name}`] = s.id;
  }

  for (const key of ["PRIMARY:English Language", "JHS:English Language"]) {
    for (const name of STRANDS) {
      await db.strand.upsert({
        where: { subjectId_name: { subjectId: subjIds[key], name } },
        update: {},
        create: { name, subjectId: subjIds[key] },
      });
    }
  }

  const oralTopics: Array<{ name: string; subj: string; cls: string }> = [
    { name: "Basic 7 Oral Language", subj: "JHS:English Language", cls: "JHS 1" },
    { name: "Basic 8 Oral Language", subj: "JHS:English Language", cls: "JHS 2" },
    { name: "Basic 9 Oral Language", subj: "JHS:English Language", cls: "JHS 3" },
  ];
  for (const t of oralTopics) {
    await db.strand.findFirstOrThrow({
      where: { subjectId: subjIds[t.subj], name: "Oral Language" },
    });
    const existing = await db.topic.findFirst({ where: { name: t.name, subjectId: subjIds[t.subj] } });
    if (!existing) {
      await db.topic.create({
        data: {
          name: t.name,
          objectives: `${t.name}: spoken English lessons.`,
          subjectId: subjIds[t.subj],
          classLevelId: classByName[t.cls],
        },
      });
    }
  }

  const [subjects, strands, topics] = await Promise.all([
    db.subject.count(),
    db.strand.count(),
    db.topic.count(),
  ]);
  console.log(`STRUCTURE: ${subjects} subjects, ${strands} strands, ${topics} topics`);
  await db.$disconnect();
}

void main();
