import { CANONICAL_HEADERS, type CanonicalQuestionRow } from "./import-export-types";

export interface QuestionForExport {
    content: string;
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    topic: string;
    subtopic?: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    year?: number | null;
    source?: string | null;
    explanation?: string | null;
    tags: unknown;
    status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
    weight?: number | null;
    answerKeys?: unknown;
    rubric?: unknown;
    options?: { content: string; isCorrect: boolean }[];
}

export function questionsToCanonicalRows(questionsWithOptions: QuestionForExport[]): CanonicalQuestionRow[] {
    return questionsWithOptions.map((q) => {
        const tags = q.tags;
        const tagsStr = Array.isArray(tags) ? (tags as string[]).join(", ") : (typeof tags === "string" ? tags : "") || "";
        const row: CanonicalQuestionRow = {
            content: q.content,
            type: q.type,
            topic: q.topic,
            subtopic: q.subtopic ?? "",
            difficulty: q.difficulty,
            year: q.year ?? undefined,
            source: q.source ?? "",
            explanation: q.explanation ?? "",
            tags: tagsStr,
            status: q.status,
            weight: q.weight ?? 1,
        };
        if (q.type === "MULTIPLE_CHOICE" && q.options?.length) {
            q.options.forEach((opt, i) => {
                const key = `option_${i + 1}` as keyof CanonicalQuestionRow;
                (row as unknown as Record<string, unknown>)[key] = opt.content;
            });
            const correctIndex = q.options.findIndex((o) => o.isCorrect);
            row.correct_option = correctIndex >= 0 ? correctIndex : 0;
        }
        if (q.type === "SHORT_ANSWER" && q.answerKeys != null) {
            row.answer_keys = typeof q.answerKeys === "string" ? q.answerKeys : JSON.stringify(q.answerKeys);
        }
        if (q.type === "ESSAY" && q.rubric != null) {
            row.rubric = typeof q.rubric === "string" ? q.rubric : JSON.stringify(q.rubric);
        }
        return row;
    });
}

export function buildTemplateRows(): { headers: string[]; sampleRow: Record<string, string | number> } {
    const headers = [...CANONICAL_HEADERS];
    const sampleRow: Record<string, string | number> = {
        content: "Contoh: Lapisan manakah yang termasuk litosfer?",
        type: "MULTIPLE_CHOICE",
        topic: "Geology",
        subtopic: "Earth Layers",
        difficulty: "MEDIUM",
        year: new Date().getFullYear(),
        source: "OSN",
        explanation: "Litosfer terdiri dari kerak dan bagian atas mantel.",
        tags: "litosfer,kerak,mantel",
        status: "DRAFT",
        weight: 1,
        option_1: "Kerak dan mantel atas",
        option_2: "Inti dalam dan luar",
        option_3: "Kerak saja",
        option_4: "Seluruh mantel",
        option_5: "",
        option_6: "",
        correct_option: 0,
        answer_keys: '[{"key":"contoh jawaban","type":"TEXT","tolerance":0}]',
        rubric: '[{"component":"Pemahaman","keywords":"litosfer, kerak","points":10}]',
    };
    return { headers, sampleRow };
}
