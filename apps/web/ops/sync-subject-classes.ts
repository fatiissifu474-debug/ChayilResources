import { EducationLevel } from "@prisma/client";
import { db } from "../src/lib/db";

const PRIMARY = ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
const JHS = ["JHS 1", "JHS 2", "JHS 3"];

/**
 * Repair + sync: every subject gets exactly its full class list.
 * (Early seeds only connected classes at creation time, leaving gaps like
 * English missing from JHS 1/3. `set` makes the links declarative.)
 */
async function main() {
  const ghana = await db.educationSystem.findUniqueOrThrow({ where: { country: "Ghana" } });
  const classes = await db.classLevel.findMany({ where: { systemId: ghana.id } });
  const classByName = Object.fromEntries(classes.map((c) => [c.name, c.id]));

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

  for (const d of defs) {
    const s = await db.subject.findFirst({
      where: { systemId: ghana.id, level: d.level, name: d.name },
    });
    if (!s) {
      console.log(`MISSING subject row: ${d.level} ${d.name} — run seed first`);
      continue;
    }
    await db.subject.update({
      where: { id: s.id },
      data: { classLevels: { set: d.classes.map((n) => ({ id: classByName[n] })) } },
    });
  }

  const check = await db.classLevel.findMany({
    include: { _count: { select: { subjects: true } } },
    orderBy: [{ level: "asc" }, { position: "asc" }],
  });
  for (const c of check) {
    console.log(`${c.name}: ${c._count.subjects} subjects`);
  }
  await db.$disconnect();
}

void main();
