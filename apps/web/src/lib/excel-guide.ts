import { COURSES } from "@/data/lessons";
import { cellId, formatCellValue, parseCellRef } from "@/lib/formula-engine";
import type { ChapterAccess } from "@/lib/pro-access";
import { parseSpec, runDemo } from "@/lib/sheet-demo-run";
import type { CourseData, LessonData } from "@/types/excel-learning";

export const GUIDE_PATH = "/learn-excel";

/** Notes shorter than this don't make a useful page by themselves; the chapter page lists them instead. */
const MIN_NOTE_WORDS = 60;

export type GuideLesson = { data: LessonData; slug: string; href: string | null };
export type GuideChapter = { course: CourseData; number: number; slug: string; pro: boolean; href: string; lessons: GuideLesson[] };

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const wordCount = (text: string | undefined) => (text ?? "").split(/\s+/).filter(Boolean).length;

/**
 * The public Excel guide, from the same chapters and access settings as the app. Hidden chapters
 * are left out. Free chapters get a page per lesson; Pro chapters are an outline, so paid notes stay paid.
 */
export function buildGuide(settings: Record<string, ChapterAccess>): GuideChapter[] {
  return COURSES.filter((c) => !settings[c.id]?.hidden).map((course, i) => {
    const slug = slugify(course.title);
    const href = `${GUIDE_PATH}/${slug}`;
    const pro = settings[course.id]?.access === "pro";
    return {
      course,
      number: i + 1,
      slug,
      pro,
      href,
      lessons: course.lessons.map((data) => {
        const lessonSlug = slugify(data.title);
        const hasPage = !pro && wordCount(data.content.conceptOverview) >= MIN_NOTE_WORDS;
        return { data, slug: lessonSlug, href: hasPage ? `${href}/${lessonSlug}` : null };
      }),
    };
  });
}

export type DemoStep = { cell: string | null; formula: string | null; caption: string };

/**
 * A spreadsheet demo as plain text and a table, for readers and crawlers that don't run it.
 * The table shows the sheet once every step has played, so results like 14 are filled in.
 */
export function readDemo(lines: string[]): { rows: string[][]; steps: DemoStep[] } {
  const spec = parseSpec(lines);
  const steps: DemoStep[] = spec.steps
    .filter((s) => s.caption)
    .map((s) => (s.kind === "type" ? { cell: s.id, formula: s.formula, caption: s.caption } : { cell: null, formula: null, caption: s.caption }));
  if (!spec.rows) return { rows: [], steps };

  const final = runDemo(spec, {}, {}).states.at(-1) ?? {};
  // A step can fill a cell below or beside the starting table, like a total under a column.
  const refs = Object.keys(final).flatMap((id) => parseCellRef(id) ?? []);
  const rowCount = Math.max(spec.rows.length, ...refs.map((r) => r.row + 1));
  const colCount = Math.max(...spec.rows.map((r) => r.length), ...refs.map((r) => r.col + 1));
  const rows = Array.from({ length: rowCount }, (_, r) =>
    Array.from({ length: colCount }, (_, c) => {
      const given = spec.rows?.[r]?.[c] ?? "";
      const cell = final[cellId(c, r)];
      const shown = cell ? formatCellValue(cell.value, cell.format) : given;
      // A name or function this page can't work out shows what was typed, not an error.
      return shown.startsWith("#") ? cell?.value.formula ?? given : shown;
    })
  );
  return { rows, steps };
}

/** Safe to put inside a <script> tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
