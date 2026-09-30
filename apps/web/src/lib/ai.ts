import Groq from "groq-sdk";
import { EducationLevel, ResourceType } from "@prisma/client";

export class AIUnavailableError extends Error {}

/** Model fallback chain: explicit env first, then fast Groq defaults (Sep 2026 IDs). */
const MODEL_CANDIDATES = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
].filter((m): m is string => !!m);

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AIUnavailableError("GROQ_API_KEY is not set");
  return new Groq({ apiKey, timeout: 15000 });
}

async function chatJson(system: string, user: string): Promise<Record<string, unknown>> {
  const client = getClient();
  let lastError: unknown = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return JSON.parse(res.choices[0]?.message?.content ?? "{}") as Record<string, unknown>;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("AI request failed");
}

export interface TaxonomyHints {
  levels: string[];
  classes: string[];
  subjects: string[];
  types: string[];
}

export interface SearchInterpretation {
  levels: EducationLevel[];
  classes: string[];
  subjects: string[];
  topics: string[];
  types: ResourceType[];
  keywords: string[];
}

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 8) : [];

/**
 * Smarter search: turn "JHS 2 fractions lesson plan" into structured filters.
 * Returns null when AI is unavailable or the output is unusable (caller falls back).
 */
export async function interpretSearch(
  query: string,
  hints: TaxonomyHints,
): Promise<SearchInterpretation | null> {
  try {
    const parsed = await chatJson(
      "You extract classroom search filters as JSON. " +
        "Respond with ONLY a JSON object shaped like " +
        '{"levels":[],"classes":[],"subjects":[],"topics":[],"types":[],"keywords":[]}. ' +
        "levels must come from the allowed list; types from the allowed list; " +
        "classes/subjects/topics must be copied EXACTLY from the allowed lists when they match, else []. " +
        "keywords: 1-5 short search words not covered by the other fields.",
      `Allowed levels: ${hints.levels.join(", ")}. ` +
        `Allowed classes: ${hints.classes.join(", ")}. ` +
        `Allowed subjects: ${hints.subjects.join(", ")}. ` +
        `Allowed types: ${hints.types.join(", ")}. ` +
        `Teacher query: ${query}`,
    );
    const levels = strArray(parsed.levels).filter((l): l is EducationLevel =>
      (Object.values(EducationLevel) as string[]).includes(l),
    );
    const types = strArray(parsed.types).filter((t): t is ResourceType =>
      (Object.values(ResourceType) as string[]).includes(t),
    );
    const matchList = (vals: string[], allowed: string[]): string[] => {
      const lower = new Map(allowed.map((a) => [a.toLowerCase(), a]));
      return [...new Set(vals.map((v) => lower.get(v.toLowerCase())).filter((x): x is string => !!x))];
    };
    // Deterministic backstop: small models don't always copy allowed spellings,
    // so also match taxonomy names directly inside the raw query.
    const ql = query.toLowerCase();
    const inQuery = (allowed: string[]): string[] =>
      allowed.filter((a) => ql.includes(a.toLowerCase()));
    const union = (...lists: string[][]): string[] => [...new Set(lists.flat())];
    const wordHit = (vals: string[]): boolean =>
      vals.some((v) => new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(query));
    return {
      levels: union(
        levels,
        (Object.values(EducationLevel) as string[]).filter((l) => wordHit([l])),
      ) as EducationLevel[],
      classes: union(matchList(strArray(parsed.classes), hints.classes), inQuery(hints.classes)),
      subjects: union(matchList(strArray(parsed.subjects), hints.subjects), inQuery(hints.subjects)),
      topics: strArray(parsed.topics).slice(0, 5),
      types,
      keywords: strArray(parsed.keywords).slice(0, 5),
    };
  } catch {
    return null;
  }
}

/** Auto-summary for a resource preview (cached in Resource.aiSummary). */
export async function summarizeResource(input: {
  title: string;
  description: string;
  type: string;
  level: string;
  subject: string | null;
}): Promise<string> {
  const parsed = await chatJson(
    "You summarize teaching resources for busy teachers. Respond with ONLY a JSON " +
      'object shaped like {"summary":"..."}. The summary is 2-3 sentences: what it is, ' +
      "who it suits, and how to use it in lesson preparation.",
    `Title: ${input.title}\nType: ${input.type}\nLevel: ${input.level}\n` +
      `Subject: ${input.subject ?? "general"}\nDescription: ${input.description.slice(0, 1500)}`,
  );
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  if (!summary) throw new Error("Empty AI summary");
  return summary.slice(0, 1200);
}

export interface LessonPrep {
  objectives: string[];
  starter: string;
  mainActivities: string[];
  workedExample: string;
  checks: string[];
  homework: string;
  differentiation: string;
}

/** Lesson-preparation assistant: structured plan for one class/subject/topic. */
export async function generateLessonPrep(input: {
  level: string;
  className: string | null;
  subject: string;
  topic: string;
}): Promise<LessonPrep> {
  const SYSTEM_BASE =
    "You are a lesson-preparation assistant for teachers in Ghana (NaCCA-style classrooms, " +
    "often 40+ learners, limited materials). Respond with ONLY a JSON object shaped like " +
    '{"objectives":[],"starter":"","mainActivities":[],"workedExample":"","checks":[],"homework":"","differentiation":""}. ' +
    "objectives: 3 measurable outcomes. starter: one 5-minute hook. mainActivities: 3 steps. " +
    "workedExample: one concrete example with solution. checks: 3 quick understanding checks. " +
    "homework: one short task. differentiation: one support + one extension idea.";
  const arr = (v: unknown): string[] => strArray(v).map((s) => s.slice(0, 600));
  const text = (v: unknown): string => (typeof v === "string" ? v.slice(0, 1200) : "");
  const toPrep = (parsed: Record<string, unknown>): LessonPrep => ({
    objectives: arr(parsed.objectives).slice(0, 5),
    starter: text(parsed.starter),
    mainActivities: arr(parsed.mainActivities).slice(0, 6),
    workedExample: text(parsed.workedExample),
    checks: arr(parsed.checks).slice(0, 5),
    homework: text(parsed.homework),
    differentiation: text(parsed.differentiation),
  });
  const complete = (p: LessonPrep): boolean =>
    p.objectives.length > 0 && !!p.starter && p.mainActivities.length > 0 && p.checks.length > 0;

  const userPrompt =
    `Level: ${input.level}\nClass: ${input.className ?? "unspecified"}\n` +
    `Subject: ${input.subject}\nTopic: ${input.topic}`;
  let prep = toPrep(await chatJson(SYSTEM_BASE, userPrompt));
  if (!complete(prep)) {
    // Small models sometimes drop keys — one firmer retry before giving up.
    prep = toPrep(
      await chatJson(SYSTEM_BASE + " Every key is required. Never use empty arrays or empty strings.", userPrompt),
    );
  }
  if (!prep.objectives.length || !prep.starter) throw new Error("Incomplete AI lesson plan");
  return prep;
}
