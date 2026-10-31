// ─── Spreadsheet Engine Types ─────────────────────────────────────────────────

export type CellType = "text" | "number" | "boolean" | "blank" | "formula" | "error";

export interface CellValue {
  raw: string; // raw input string
  computed: string | number | boolean | null; // evaluated result
  type: CellType;
  formula?: string; // formula string if cell has formula
  error?: string; // error code if type=error: #DIV/0!, #VALUE!, #REF!, #NAME?, #N/A
  spillRange?: string; // on a formula whose array result spills, e.g. "E2:E6"
  spillFrom?: string; // on a cell filled by another cell's spill: the formula cell's id
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  numberFormat?: string; // "currency", "percentage", "number", "date", "text"
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  wrap?: boolean;
}

export interface Cell {
  id: string; // e.g. "A1"
  value: CellValue;
  format?: CellFormat;
  readOnly?: boolean;
  highlighted?: boolean; // for lesson highlighting
  note?: string; // cell note/comment
}

export type WorksheetData = Record<string, Cell>; // key = "A1", "B2", etc.

export interface Worksheet {
  id: string;
  name: string;
  cells: WorksheetData;
  rowCount: number;
  colCount: number;
  frozenRows?: number;
  frozenCols?: number;
  colWidths?: Record<number, number>; // col index -> width in px
  rowHeights?: Record<number, number>; // row index -> height in px
  names?: Record<string, string>; // named ranges and Table[Column] refs -> range, e.g. { Amount: "E2:E23" }
}

export interface Workbook {
  id: string;
  sheets: Worksheet[];
  activeSheetId: string;
}

// ─── Lesson Engine Types ───────────────────────────────────────────────────────

export type ChallengeType =
  | "formula"        // Enter a formula in a cell
  | "cell_edit"      // Modify cell values
  | "find_error"     // Find and fix an error
  | "data_cleaning"  // Clean data
  | "multiple_choice" // Multiple choice question
  | "range_select"   // Select a range
  | "mission"        // Multi-task real world mission
  | "shortcut";      // Keyboard shortcut

export type ValidationMode =
  | "exact_text"
  | "numeric_value"
  | "formula_result"
  | "required_formula"
  | "cell_value"
  | "formula_contains"
  | "cell_range"
  | "multiple_valid";

export interface ValidationRule {
  mode: ValidationMode;
  targetCell: string; // e.g. "C5"
  expectedValue?: string | number | boolean;
  tolerance?: number; // for numeric comparison
  requiredFormulas?: string[]; // function names that must appear
  forbiddenValues?: (string | number)[]; // values that are NOT valid (e.g. hardcoded answers when formula required)
  validAnswers?: Array<string | number>; // multiple acceptable values
  caseSensitive?: boolean;
  message?: string; // custom feedback message
}

export interface Hint {
  level: 1 | 2 | 3;
  text: string;
  example?: string; // optional code/formula example
}

export interface ChallengeOption {
  id: string;
  text: string;
  correct: boolean;
  explanation?: string;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  instruction: string;
  detail?: string; // additional detail text
  targetCell?: string; // primary target cell
  targetRange?: string; // e.g. "A1:C5"
  validationRules: ValidationRule[];
  hints: Hint[];
  successMessage: string;
  explanation: string; // shown after completion
  xpReward?: number;
  options?: ChallengeOption[]; // for multiple_choice
  shortcutKey?: string; // for shortcut challenges
  requiredFormula?: string; // e.g. "SUM"
  timeLimit?: number; // seconds, optional
}

export interface LessonContent {
  challenges: Challenge[];
  initialWorkbook: Workbook;
  conceptOverview?: string; // markdown content shown before lesson
  completionMessage?: string;
}

export type LessonDifficulty = "beginner" | "intermediate" | "advanced";
export type LessonStatus = "not_started" | "in_progress" | "completed" | "mastered";

export interface LessonData {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  sortOrder: number;
  prerequisites: string[]; // lesson slugs
  content: LessonContent;
  published: boolean;
  skills: string[]; // skill keys this lesson teaches
  kind?: "lesson" | "lab" | "capstone"; // labs and capstones combine a chapter's skills
  fullExcel?: boolean; // show the whole Excel window (title bar, ribbon, status bar) around the sheet
}

export interface CourseData {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: LessonDifficulty;
  sortOrder: number;
  published: boolean;
  icon: string;
  color: string;
  formula?: string; // formula shown in the chapter banner illustration
  lessons: LessonData[];
}

// ─── Progress Types ────────────────────────────────────────────────────────────

export interface LessonProgressData {
  lessonId: string;
  status: LessonStatus;
  currentChallengeIndex: number;
  attempts: number;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

// ─── Gamification Types ────────────────────────────────────────────────────────

export interface XpTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
}

export interface UserStats {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  currentLevel: number;
  xpForNextLevel: number;
  xpProgress: number; // xp within current level
  lessonsCompleted: number;
  coursesCompleted: number;
  skillsMastered: number;
  dailyGoalMinutes: number;
  dailyGoalProgress: number; // minutes today
}

// ─── Spreadsheet Engine State ──────────────────────────────────────────────────

export interface SpreadsheetState {
  workbook: Workbook;
  selectedCell: string | null;
  selectedRange: string | null;
  editingCell: string | null;
  editValue: string;
  isEditing: boolean;
  history: WorkbookSnapshot[];
  historyIndex: number;
}

export interface WorkbookSnapshot {
  workbook: Workbook;
  timestamp: number;
}

export type FormulaError = "#DIV/0!" | "#VALUE!" | "#REF!" | "#NAME?" | "#N/A" | "#NULL!" | "#NUM!";
