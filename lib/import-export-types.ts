/**
 * Canonical format for Bank Soal import/export.
 * One row = one question. MULTIPLE_CHOICE uses option_1..option_6 + correct_option (0-based index).
 */

export const QUESTION_TYPES = ["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"] as const;
export const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"] as const;
export const QUESTION_STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"] as const;

export const CANONICAL_HEADERS = [
    "content",
    "type",
    "topic",
    "subtopic",
    "difficulty",
    "year",
    "source",
    "explanation",
    "tags",
    "status",
    "weight",
    "option_1",
    "option_2",
    "option_3",
    "option_4",
    "option_5",
    "option_6",
    "correct_option",
    "answer_keys",
    "rubric",
] as const;

export type CanonicalHeader = (typeof CANONICAL_HEADERS)[number];

export interface AnswerKeyRow {
    key: string;
    type: "TEXT" | "NUMERIC";
    tolerance?: number;
}

export interface RubricRow {
    component: string;
    keywords: string | string[];
    points: number;
}

export interface CanonicalQuestionRow {
    content: string;
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    topic: string;
    subtopic?: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    year?: number;
    source?: string;
    explanation?: string;
    tags?: string[] | string;
    status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
    weight?: number;
    option_1?: string;
    option_2?: string;
    option_3?: string;
    option_4?: string;
    option_5?: string;
    option_6?: string;
    correct_option?: number;
    answer_keys?: AnswerKeyRow[] | string;
    rubric?: RubricRow[] | string;
}

export interface ImportRowError {
    rowIndex: number;
    field?: string;
    message: string;
}

export interface ValidateImportResult {
    rows: CanonicalQuestionRow[];
    errors: ImportRowError[];
}

export interface CommitImportResult {
    successCount: number;
    failedRows: { rowIndex: number; message: string }[];
}

export type ColumnMapping = Partial<Record<CanonicalHeader, string>>;
