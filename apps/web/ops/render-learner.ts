import * as fs from "node:fs";
import * as path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  Header,
  Footer,
  Numbering,
  LevelFormat,
} from "docx";

const MANIFEST = "C:\\Users\\David\\AppData\\Local\\Temp\\learner-manifest.json";
const REPO = path.resolve(__dirname, "../../..");
const DIR_FOR: Record<number, string> = {
  7: "Basic 7 Learner Resource",
  8: "Basic 8 Learner Resource",
  9: "Basic 9 Learner Resource",
};

// Palette sampled from the contributor originals
const NAVY = "1F3A5F";
const BLUE = "2E74B5";
const DARK_BLUE = "1F4D78";
const GOLD_BG = "FEF3C7";
const GOLD_TX = "92400E";
const BODY_TX = "222222";
const FONT = "Calibri";

const asArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const asStr = (v: unknown): string => (typeof v === "string" ? v : "");

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 21, color: BODY_TX })],
    spacing: { after: 120 },
  });
}

function bullets(items: string[]): Paragraph[] {
  return items.map(
    (t) =>
      new Paragraph({
        children: [new TextRun({ text: t, font: FONT, size: 21, color: BODY_TX })],
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 60 },
      }),
  );
}

function cell(text: string, opts: { bold?: boolean; fill?: string; color?: string; size?: number } = {}): TableCell {
  return new TableCell({
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.SOLID } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FONT,
            size: opts.size ?? 20,
            bold: opts.bold,
            color: opts.color ?? BODY_TX,
          }),
        ],
        spacing: { after: 40 },
      }),
    ],
  });
}

function dataTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h) => cell(h, { bold: true, fill: NAVY, color: "FFFFFF" })),
      }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

function callout(title: string, text: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: GOLD_BG, type: ShadingType.SOLID },
            children: [
              new Paragraph({
                children: [new TextRun({ text: title, font: FONT, size: 22, bold: true, color: GOLD_TX })],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [new TextRun({ text, font: FONT, size: 20, color: BODY_TX })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  const spec =
    level === HeadingLevel.HEADING_1
      ? { size: 32, color: BLUE }
      : level === HeadingLevel.HEADING_2
        ? { size: 26, color: BLUE }
        : { size: 24, color: DARK_BLUE };
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, font: FONT, size: spec.size, bold: true, color: spec.color })],
    spacing: { before: 240, after: 120 },
  });
}

function parseSection(s: unknown): {
  heading: string;
  level: number;
  paragraphs: string[];
  bullets: string[];
  table?: { headers: string[]; rows: string[][] };
  callout?: { title: string; body: string };
} {
  const o =
    typeof s === "string"
      ? s.trim().startsWith("{")
        ? (JSON.parse(s) as Record<string, unknown>)
        : ({} as Record<string, unknown>)
      : ((s ?? {}) as Record<string, unknown>);
  const tbl = o.table as { headers?: unknown; rows?: unknown } | undefined;
  const co = o.callout as { title?: unknown; body?: unknown } | undefined;
  return {
    heading: asStr(o.heading),
    level: typeof o.level === "number" ? o.level : 1,
    paragraphs: asArr(o.paragraphs),
    bullets: asArr(o.bullets),
    table:
      tbl && Array.isArray(tbl.headers) && Array.isArray(tbl.rows)
        ? { headers: asArr(tbl.headers), rows: (tbl.rows as unknown[]).map((r) => asArr(r)) }
        : undefined,
    callout:
      co && (asStr(co.title) || asStr(co.body))
        ? { title: asStr(co.title), body: asStr(co.body) }
        : undefined,
  };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Array<Record<string, unknown>>;
  let done = 0;

  for (const m of manifest) {
    if (m.failed) {
      console.log(`SKIP failed unit basic ${m.basic} lesson ${m.num}`);
      continue;
    }
    const u = m.unit as Record<string, unknown>;
    const basic = m.basic as number;
    const num = m.num as number;
    const title = `Basic ${basic} English — Oral Language Lesson ${num}`;
    const unitTitle = asStr(u.unitTitle) || title;
    const kids: Array<Paragraph | Table> = [];

    // Cover
    kids.push(
      new Paragraph({
        shading: { fill: NAVY, type: ShadingType.SOLID },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "ENGLISH LANGUAGE  ·  ORAL LANGUAGE", font: FONT, size: 20, bold: true, color: "FFFFFF" })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: unitTitle, font: FONT, size: 60, bold: true, color: "FFFFFF" })],
        shading: { fill: NAVY, type: ShadingType.SOLID },
        spacing: { after: 60 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { fill: NAVY, type: ShadingType.SOLID },
        children: [new TextRun({ text: asStr(u.subtitle) || `Basic ${basic} learner book`, font: FONT, size: 24, color: "F6C945" })],
        spacing: { after: 240 },
      }),
      heading("Welcome to Your Unit!", HeadingLevel.HEADING_2),
      body(asStr(u.welcome)),
      heading("What You Will Learn", HeadingLevel.HEADING_2),
      ...bullets(asArr(u.objectives)),
    );

    const kw = (u.keyWords ?? u.keywords) as Array<{ word?: unknown; meaning?: unknown }> | undefined;
    if (Array.isArray(kw) && kw.length) {
      kids.push(heading("Key Words", HeadingLevel.HEADING_2));
      kids.push(
        dataTable(
          ["Word", "Meaning"],
          kw.map((k) => [asStr(k.word), asStr(k.meaning)]),
        ),
      );
    }
    const rem = asArr(u.remember);
    if (rem.length) {
      kids.push(heading("Remember What You Already Know", HeadingLevel.HEADING_2), ...bullets(rem));
    }
    if (asStr(u.howToUse)) {
      kids.push(heading("How to Use This Unit", HeadingLevel.HEADING_2), body(asStr(u.howToUse)));
    }

    for (const raw of (Array.isArray(u.sections) ? (u.sections as unknown[]) : [])) {
      const s = parseSection(raw);
      if (!s.heading) continue;
      kids.push(
        heading(
          s.heading,
          s.level === 3 ? HeadingLevel.HEADING_3 : s.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1,
        ),
      );
      for (const p of s.paragraphs) kids.push(body(p));
      kids.push(...bullets(s.bullets));
      if (s.table && s.table.headers.length && s.table.rows.length) kids.push(dataTable(s.table.headers, s.table.rows));
      if (s.callout) kids.push(callout(s.callout.title || "Remember", s.callout.body));
    }

    const tog = u.together as Record<string, unknown> | undefined;
    if (tog) {
      kids.push(heading(asStr(tog.title) || "Practise Together", HeadingLevel.HEADING_1));
      if (asStr(tog.intro)) kids.push(body(asStr(tog.intro)));
      kids.push(...bullets(asArr(tog.steps)));
      const cl = asArr(tog.checklist);
      if (cl.length) kids.push(dataTable(["Check yourself", "✓"], cl.map((c) => [c, ""])));
    }

    const solo = u.solo as { levels?: Array<{ name?: unknown; tasks?: unknown }> } | undefined;
    if (solo && Array.isArray(solo.levels) && solo.levels.length) {
      kids.push(heading("Practise on Your Own", HeadingLevel.HEADING_1));
      for (const lv of solo.levels) {
        kids.push(heading(asStr(lv.name) || "Level", HeadingLevel.HEADING_3));
        kids.push(...bullets(asArr(lv.tasks)));
      }
    }

    const check = u.check as { partA?: unknown; partB?: unknown } | undefined;
    if (check) {
      kids.push(heading("Check What You Have Learned", HeadingLevel.HEADING_1));
      const pa = asArr(check.partA);
      const pb = asArr(check.partB);
      if (pa.length) {
        kids.push(heading("Part A", HeadingLevel.HEADING_3), ...bullets(pa));
      }
      if (pb.length) {
        kids.push(heading("Part B", HeadingLevel.HEADING_3), ...bullets(pb));
      }
    }

    const show = u.show as { task?: unknown; checklist?: unknown } | undefined;
    if (show) {
      kids.push(heading("Show What You Know", HeadingLevel.HEADING_1));
      if (asStr(show.task)) kids.push(body(asStr(show.task)));
      const cl = asArr(show.checklist);
      if (cl.length) kids.push(dataTable(["Success looks like", "✓"], cl.map((c) => [c, ""])));
    }

    if (asStr(u.summary)) {
      kids.push(heading("What We Have Learned", HeadingLevel.HEADING_1), body(asStr(u.summary)));
    }
    const glance = u.glance as { headers?: unknown; rows?: unknown } | undefined;
    if (glance && Array.isArray(glance.headers) && Array.isArray(glance.rows)) {
      kids.push(heading("At a Glance", HeadingLevel.HEADING_2));
      kids.push(
        dataTable(asArr(glance.headers), (glance.rows as unknown[]).map((r) => asArr(r))),
      );
    }
    const self = asArr(u.selfCheck);
    if (self.length) {
      kids.push(heading("How Did I Do?", HeadingLevel.HEADING_2), ...bullets(self));
    }
    if (asStr(u.lookAhead)) {
      kids.push(heading("Look Ahead", HeadingLevel.HEADING_2), body(asStr(u.lookAhead)));
    }
    if (asStr(u.illustratorBrief)) {
      kids.push(callout("Illustrator's brief (for production)", asStr(u.illustratorBrief)));
    }

    const outDir = path.join(REPO, `Basic ${basic} Learner Resource`);
    fs.mkdirSync(outDir, { recursive: true });
    const filename = `Learner_B${basic}_English_Lesson${num}.docx`;
    const doc = new Document({
      numbering: {
        config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT }] }],
      },
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "ChayilResources · Learner Resources", font: FONT, size: 16, color: "595959" })],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: unitTitle, font: FONT, size: 16, color: "595959" }),
                  ],
                }),
              ],
            }),
          },
          children: kids,
        },
      ],
    });
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(outDir, filename), buf);
    done++;
    console.log(`WROTE ${filename} (${buf.byteLength} bytes)`);
  }

  console.log(`RENDERED: ${done} documents`);
}

void main();
