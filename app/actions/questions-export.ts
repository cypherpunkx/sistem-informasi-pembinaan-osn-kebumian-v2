"use server";

import { db } from "@/lib/db";
import { questions, options as optionsTable, users } from "@/lib/schema";
import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";
import { auth } from "@/auth";

export interface ExportFilter {
    topic?: string;
    difficulty?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    createdBy?: string;
}

export interface QuestionWithOptions {
    id: number;
    content: string;
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    topic: string;
    subtopic: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    year: number | null;
    source: string | null;
    explanation: string | null;
    tags: unknown;
    status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
    weight: number | null;
    answerKeys: unknown;
    rubric: unknown;
    createdBy: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    options?: { content: string; isCorrect: boolean }[];
    creatorName?: string;
}

export async function getQuestionsForExport(filter?: ExportFilter): Promise<QuestionWithOptions[]> {
    const session = await auth();
    if (!session?.user?.id) return [];
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "pembina")) return [];

    const conditions = [];
    if (filter?.topic && filter.topic !== "All" && filter.topic !== "") {
        conditions.push(eq(questions.topic, filter.topic));
    }
    if (filter?.difficulty && filter.difficulty !== "All" && filter.difficulty !== "") {
        conditions.push(eq(questions.difficulty, filter.difficulty as "EASY" | "MEDIUM" | "HARD"));
    }
    if (filter?.createdAtFrom) {
        const d = new Date(filter.createdAtFrom);
        if (!isNaN(d.getTime())) conditions.push(gte(questions.createdAt, d));
    }
    if (filter?.createdAtTo) {
        const d = new Date(filter.createdAtTo);
        d.setHours(23, 59, 59, 999);
        if (!isNaN(d.getTime())) conditions.push(lte(questions.createdAt, d));
    }
    if (filter?.createdBy && filter.createdBy !== "All" && filter.createdBy !== "") {
        conditions.push(eq(questions.createdBy, parseInt(filter.createdBy)));
    }

    const rows = await db.query.questions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(questions.createdAt)],
    });

    if (rows.length === 0) return [];

    const questionIds = rows.map((r) => r.id);
    const allOptions = await db.select().from(optionsTable).where(inArray(optionsTable.questionId, questionIds));
    const optionsByQ = new Map<number, { content: string; isCorrect: boolean }[]>();
    for (const opt of allOptions) {
        const list = optionsByQ.get(opt.questionId) ?? [];
        list.push({ content: opt.content, isCorrect: opt.isCorrect });
        optionsByQ.set(opt.questionId, list);
    }

    const creatorIds = [...new Set(rows.map((r) => r.createdBy).filter(Boolean))] as number[];
    const creatorNames = new Map<number, string>();
    if (creatorIds.length > 0) {
        const creators = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, creatorIds));
        creators.forEach((c) => creatorNames.set(c.id, c.name));
    }

    return rows.map((q) => ({
        ...q,
        options: optionsByQ.get(q.id) ?? [],
        creatorName: q.createdBy ? creatorNames.get(q.createdBy) : undefined,
    })) as QuestionWithOptions[];
}

export interface QuestionCreator {
    id: number;
    name: string;
}

export async function getQuestionCreators(): Promise<QuestionCreator[]> {
    const session = await auth();
    if (!session?.user?.id) return [];
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "pembina")) return [];

    const withCreator = await db
        .selectDistinct({ createdBy: questions.createdBy })
        .from(questions)
        .where(sql`${questions.createdBy} IS NOT NULL`);
    const ids = withCreator.map((r) => r.createdBy).filter(Boolean) as number[];
    if (ids.length === 0) return [];
    const list = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids));
    return list as QuestionCreator[];
}
