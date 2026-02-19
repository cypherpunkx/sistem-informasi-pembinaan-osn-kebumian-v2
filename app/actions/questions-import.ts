"use server";

import { db } from "@/lib/db";
import { questions, options as optionsTable, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { normalizeTopic } from "@/lib/utils";
import type {
    CanonicalQuestionRow,
    ValidateImportResult,
    CommitImportResult,
    AnswerKeyRow,
    RubricRow,
} from "@/lib/import-export-types";

const QUESTION_TYPES = ["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"];
const MAX_IMPORT_ROWS = 500;

function parseJson<T>(str: string, fallback: T): T {
    if (!str || typeof str !== "string") return fallback;
    try {
        const v = JSON.parse(str.trim());
        return v as T;
    } catch {
        return fallback;
    }
}

export async function validateImportRows(
    rows: CanonicalQuestionRow[],
    options?: { checkDuplicate?: boolean }
): Promise<ValidateImportResult> {
    const errors: ValidateImportResult["errors"] = [];
    const validRows: CanonicalQuestionRow[] = [];

    if (rows.length > MAX_IMPORT_ROWS) {
        errors.push({ rowIndex: -1, message: `Maksimal ${MAX_IMPORT_ROWS} baris per import.` });
        return { rows: [], errors };
    }

    const existingPairs: Set<string> = new Set();
    if (options?.checkDuplicate) {
        const all = await db.select({ content: questions.content, topic: questions.topic }).from(questions);
        all.forEach((r) => existingPairs.add(`${(r.content || "").trim()}|${(r.topic || "").trim()}`));
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        const rowErrors: string[] = [];

        if (!row.content || String(row.content).trim() === "") {
            rowErrors.push("content tidak boleh kosong");
        }
        if (!QUESTION_TYPES.includes(row.type as string)) {
            rowErrors.push("type harus MULTIPLE_CHOICE, SHORT_ANSWER, atau ESSAY");
        }
        if (!row.topic || String(row.topic).trim() === "") {
            rowErrors.push("topic tidak boleh kosong");
        }
        if (!DIFFICULTIES.includes(row.difficulty as string)) {
            rowErrors.push("difficulty harus EASY, MEDIUM, atau HARD");
        }
        if (row.status != null && !STATUSES.includes(row.status as string)) {
            rowErrors.push("status harus DRAFT, PENDING, PUBLISHED, atau ARCHIVED");
        }
        const weight = row.weight != null ? Number(row.weight) : 1;
        if (isNaN(weight) || weight < 0) {
            rowErrors.push("weight harus angka non-negatif");
        }

        if (row.type === "MULTIPLE_CHOICE") {
            const opts = [
                row.option_1,
                row.option_2,
                row.option_3,
                row.option_4,
                row.option_5,
                row.option_6,
            ].filter((o) => o != null && String(o).trim() !== "");
            if (opts.length === 0) {
                rowErrors.push("Multiple choice harus memiliki minimal satu opsi");
            }
            const correct = row.correct_option != null ? Number(row.correct_option) : 0;
            if (opts.length > 0 && (correct < 0 || correct >= opts.length)) {
                rowErrors.push("correct_option harus index opsi yang benar (0-based)");
            }
        }

        if (row.type === "SHORT_ANSWER") {
            const keys = parseJson<AnswerKeyRow[]>(String(row.answer_keys ?? ""), []);
            if (!Array.isArray(keys) || keys.length === 0) {
                rowErrors.push("answer_keys harus JSON array dengan minimal satu key");
            } else {
                const hasKey = keys.some((k) => k && String(k.key).trim() !== "");
                if (!hasKey) rowErrors.push("answer_keys harus berisi minimal satu jawaban tidak kosong");
            }
        }

        if (row.type === "ESSAY") {
            const rub = parseJson<RubricRow[]>(String(row.rubric ?? ""), []);
            if (!Array.isArray(rub) || rub.length === 0) {
                rowErrors.push("rubric harus JSON array dengan minimal satu komponen");
            }
        }

        if (options?.checkDuplicate && row.content && row.topic) {
            const key = `${String(row.content).trim()}|${normalizeTopic(String(row.topic).trim()) || ""}`;
            if (existingPairs.has(key)) {
                rowErrors.push("Duplikat: soal dengan content dan topic yang sama sudah ada");
            }
        }

        if (rowErrors.length > 0) {
            rowErrors.forEach((msg) => errors.push({ rowIndex: rowNum, message: msg }));
        } else {
            validRows.push(row);
        }
    }

    return { rows: validRows, errors };
}

export async function commitImportQuestions(rows: CanonicalQuestionRow[]): Promise<CommitImportResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { successCount: 0, failedRows: [{ rowIndex: 0, message: "Unauthorized" }] };
    }

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "pembina")) {
        return { successCount: 0, failedRows: [{ rowIndex: 0, message: "Unauthorized" }] };
    }

    const resolveStatus = (rowStatus: string): "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED" => {
        const raw = (rowStatus ?? "").trim();
        const s = (raw || "DRAFT").toUpperCase() as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
        const valid = ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"].includes(s) ? s : "DRAFT";
        if (currentUser.role === "pembina") {
            if (valid === "PUBLISHED") return "PENDING";
            if (valid === "DRAFT") return "PENDING";
        }
        return valid;
    };

    const failedRows: CommitImportResult["failedRows"] = [];
    let successCount = 0;
    const userId = parseInt(session.user.id);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        try {
            const topic = normalizeTopic(String(row.topic || "").trim()) || "General";
            const answerKeys = parseJson<AnswerKeyRow[]>(String(row.answer_keys ?? ""), []);
            const rubric = parseJson<RubricRow[]>(String(row.rubric ?? ""), []);

            const [inserted] = await db
                .insert(questions)
                .values({
                    content: String(row.content).trim(),
                    type: row.type as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
                    topic,
                    subtopic: row.subtopic ? String(row.subtopic).trim() : null,
                    difficulty: row.difficulty as "EASY" | "MEDIUM" | "HARD",
                    year: row.year != null ? Number(row.year) : new Date().getFullYear(),
                    source: row.source ? String(row.source).trim() : null,
                    explanation: row.explanation ? String(row.explanation).trim() : null,
                    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === "string" && row.tags ? row.tags.split(",").map((t) => t.trim()) : []),
                    status: resolveStatus(String(row.status || "DRAFT")),
                    weight: row.weight != null ? Number(row.weight) : 1,
                    answerKeys: row.type === "SHORT_ANSWER" ? answerKeys : [],
                    rubric: row.type === "ESSAY" ? rubric : [],
                    createdBy: userId,
                })
                .$returningId();

            if (row.type === "MULTIPLE_CHOICE") {
                const opts = [
                    row.option_1,
                    row.option_2,
                    row.option_3,
                    row.option_4,
                    row.option_5,
                    row.option_6,
                ].filter((o) => o != null && String(o).trim() !== "");
                const correctIndex = Math.min(
                    Math.max(0, Number(row.correct_option) ?? 0),
                    opts.length - 1
                );
                if (opts.length > 0) {
                    await db.insert(optionsTable).values(
                        opts.map((content, idx) => ({
                            questionId: inserted.id,
                            content: String(content).trim(),
                            isCorrect: idx === correctIndex,
                        }))
                    );
                }
            }
            successCount++;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Database error";
            failedRows.push({ rowIndex: rowNum, message });
        }
    }

    revalidatePath("/dashboard/bank-soal");
    return { successCount, failedRows };
}
