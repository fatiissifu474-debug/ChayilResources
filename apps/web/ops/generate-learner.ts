import * as fs from "node:fs";
import * as path from "node:path";
import mammoth from "mammoth";
import Groq from "groq-sdk";

const REPO = path.resolve(__dirname, "../../..");
const OUT = "C:\\Users\\David\\AppData\\Local\\Temp\\learner-manifest.json";

const DIRS = [
  { dir: "Basic 7 Oral Language", basic: 7, cls: "JHS 1", prefix: "B7", skip: [1, 2] },
  { dir: "Basic 8 Oral Language", basic: 8, cls: "JHS 2", prefix: "B8", skip: [] as number[] },
  { dir: "Basic 9 Oral Language", basic: 9, cls: "JHS 3", prefix: "B9", skip: [] as number[] },
];

const MODELS = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];

function getKey(): string {
  const env = fs.readFileSync(path.join(REPO, "apps/web/.env"), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("GROQ_API_KEY=")) ?? "";
  return line.replace("GROQ_API_KEY=", "").trim().replace(/^"|"$/g, "");
}

const SYSTEM =
  "You write learner-facing textbook units for Ghanaian JHS learners (ages 12-15), " +
  "warm second-person voice, short sentences, Ghanaian classroom examples. " +
  "Respond with ONLY a JSON object with EXACTLY these keys: " +
  '{"unitTitle","subtitle","welcome","objectives":[],"keyWords":[{"word":"","meaning":""}],' +
  '"remember":[],"howToUse":"","sections":[{"heading":"","level":1,"paragraphs":[],"bullets":[],"table":{"headers":[],"rows":[]},"callout":{"title":"","body":""}}],' +
  '"together":{"title":"","intro":"","steps":[],"checklist":[]},"solo":{"levels":[{"name":"","tasks":[]}]},' +
  '"check":{"partA":[],"partB":[]},"show":{"task":"","checklist":[]},"summary":"","glance":{"headers":[],"rows":[]},' +
  '"selfCheck":[],"lookAhead":"","illustratorBrief":""}. ' +
  "Rules: sections has 4-6 content entries (level 1 headings with level-2 subsections where useful); " +
  "every section needs paragraphs OR bullets; include at least 2 tables and 2 callouts across the unit; " +
  "together = group role-play activity; solo has EXACTLY 3 levels (Getting Started / On Track / Stretch) " +
  "with Stretch demanding evaluation or creation; check = assessment blending recall and strategic thinking; " +
  "show = performance task with checklist; keyWords 6-10 items; objectives 3-4; " +
  "keep total length 2200-3200 words; plain text only, no markdown.";

async function chatOnce(
  client: Groq,
  teacherText: string,
  basic: number,
): Promise<Record<string, unknown>> {
  let last: unknown = null;
  for (const model of MODELS) {
    try {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content:
              `Write the learner unit for Basic ${basic} Oral Language on the topic below. ` +
              `Unit title should name the topic plainly. Teacher plan source:\n${teacherText.slice(0, 6000)}`,
          },
        ],
      });
      return JSON.parse(res.choices[0]?.message?.content ?? "{}");
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error("groq failed");
}

async function chat(client: Groq, teacherText: string, basic: number): Promise<Record<string, unknown> | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const unit = await chatOnce(client, teacherText, basic);
      if (unit && typeof unit === "object" && Array.isArray((unit as { sections?: unknown }).sections)) {
        return unit;
      }
      console.log(`  retry ${attempt}: bad shape`);
    } catch (e) {
      console.log(`  retry ${attempt}: ${e instanceof Error ? e.message.slice(0, 120) : e}`);
    }
  }
  return null;
}

async function main() {
  const client = new Groq({ apiKey: getKey(), timeout: 90000 });
  const manifest: Array<Record<string, unknown>> = [];

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
      const num = parseInt(file.match(/Lesson(\d+)/)?.[1] ?? "0", 10);
      if (d.skip.includes(num)) continue;
      const out = await mammoth.extractRawText({ path: path.join(folder, file) });
      const text = out.value.replace(/\s+/g, " ").trim().slice(0, 6000);
      console.log(`DRAFT Basic ${d.basic} lesson ${num}...`);
      const unit = await chat(client, text, d.basic);
      if (!unit) {
        manifest.push({ basic: d.basic, cls: d.cls, num, file, failed: true });
        console.log(`FAIL lesson ${num} after retries`);
        continue;
      }
      manifest.push({
        basic: d.basic,
        cls: d.cls,
        num,
        file,
        title: `Basic ${d.basic} English — Oral Language Lesson ${num}`,
        sourceRef: `Basic ${d.basic} Oral Language Lesson ${num}`,
        unit,
      });
      console.log(`OK lesson ${num} (${JSON.stringify(unit).length} chars)`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(manifest));
  console.log(`MANIFEST: ${manifest.length} units -> ${OUT}`);
}

void main();
