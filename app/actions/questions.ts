"use server";

import { db } from "@/lib/db";
import { questions, options as optionsTable, users } from "@/lib/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { normalizeTopic } from "@/lib/utils";

export async function getQuestions(filter?: { topic?: string; type?: string; search?: string; status?: string }) {
    await auth();

    const conditions = [];

    // Filter by topic
    if (filter?.topic && filter.topic !== "All") {
        conditions.push(eq(questions.topic, filter.topic));
    }
    // Filter by type
    if (filter?.type && filter.type !== "All") {
        conditions.push(eq(questions.type, filter.type as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY"));
    }
    // Filter by status
    if (filter?.status && filter.status !== "All") {
        conditions.push(eq(questions.status, filter.status as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED"));
    }
    // Filter by search
    if (filter?.search) {
        conditions.push(like(questions.content, `%${filter.search}%`));
    }

    // Role-based filtering
    // If not admin, maybe restrict? 
    // Requirement: Admin sees "Needs Approval" (PENDING). Pembina sees their own "PENDING" or "DRAFT".
    // For now, let's allow fetching all, but frontend will filter/tabulate.
    // However, for "Needs Approval" specific view, we might want a dedicated function or just use status filter.

    const data = await db.query.questions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(questions.createdAt)],
        with: {
        }
    });

    return data;
}

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export interface QuestionFilters {
    topic?: string;
    type?: string;
    search?: string;
    status?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
}

export interface GetQuestionsFilteredResult {
    data: Awaited<ReturnType<typeof getQuestions>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getQuestionsFiltered(filters: QuestionFilters = {}): Promise<GetQuestionsFilteredResult> {
    const { topic, type, search, status, difficulty, page = 1, limit: rawLimit = DEFAULT_PAGE_SIZE } = filters;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawLimit));

    const conditions = [];
    if (topic && topic !== "All") conditions.push(eq(questions.topic, topic));
    if (type && type !== "All") conditions.push(eq(questions.type, type as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY"));
    if (status && status !== "All") conditions.push(eq(questions.status, status as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED"));
    if (difficulty && difficulty !== "All") conditions.push(eq(questions.difficulty, difficulty as "EASY" | "MEDIUM" | "HARD"));
    if (search?.trim()) conditions.push(like(questions.content, `%${search.trim()}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (Math.max(1, page) - 1) * limit;

    const data = await db.query.questions.findMany({
        where: whereClause,
        orderBy: [desc(questions.createdAt)],
        limit,
        offset,
    });

    return { data, total, page: Math.max(1, page), limit, totalPages };
}

export interface GetPendingQuestionsFilteredResult {
    data: Awaited<ReturnType<typeof getQuestions>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getPendingQuestionsFiltered(filters: { page?: number; limit?: number } = {}): Promise<GetPendingQuestionsFilteredResult> {
    const { page = 1, limit: rawLimit = DEFAULT_PAGE_SIZE } = filters;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawLimit));

    const whereClause = eq(questions.status, "PENDING");

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (Math.max(1, page) - 1) * limit;

    const data = await db.query.questions.findMany({
        where: whereClause,
        orderBy: [desc(questions.createdAt)],
        limit,
        offset,
    });

    return { data, total, page: Math.max(1, page), limit, totalPages };
}

export async function getQuestionById(id: number) {
    try {
        const question = await db.query.questions.findFirst({
            where: eq(questions.id, id),
        });

        if (!question) return null;

        const options = await db.select().from(optionsTable).where(eq(optionsTable.questionId, id));

        return { ...question, options };
    } catch (error) {
        console.error("Failed to fetch question:", error);
        return null;
    }
}

export async function createQuestion(_prevState: unknown, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });

    if (!currentUser) {
        return { success: false, message: "User not found" };
    }
    if (currentUser.role === "peserta") {
        return { success: false, message: "Peserta hanya boleh mengerjakan ujian." };
    }

    const requestedStatus = (formData.get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";

    // Authorization check for status
    let finalStatus = requestedStatus;
    if (currentUser.role === "pembina" && requestedStatus === "PUBLISHED") {
        finalStatus = "PENDING"; // Pembina cannot publish directly
    }

    const topicRaw = (formData.get("topic") as string) || "";
    const rawData = {
        content: formData.get("content") as string,
        type: formData.get("type") as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
        topic: normalizeTopic(topicRaw.trim()) || "General",
        subtopic: formData.get("subtopic") as string,
        difficulty: formData.get("difficulty") as "EASY" | "MEDIUM" | "HARD",
        source: formData.get("source") as string,
        year: parseInt(formData.get("year") as string) || new Date().getFullYear(),
        explanation: formData.get("explanation") as string,
        status: finalStatus,
        // Scoring fields
        weight: parseFloat(formData.get("weight") as string) || 1,
        answerKeys: JSON.parse((formData.get("answer_keys") as string) || "[]"),
        rubric: JSON.parse((formData.get("rubric") as string) || "[]"),
        createdBy: parseInt(session.user.id),
    };

    try {
        const [newQuestion] = await db.insert(questions).values(rawData).$returningId();

        if (rawData.type === "MULTIPLE_CHOICE") {
            const optionsContent = formData.getAll("option_content");
            const correctOptionIndex = parseInt(formData.get("correct_option") as string);

            if (optionsContent.length > 0) {
                const optionsToInsert = optionsContent.map((content, idx) => ({
                    questionId: newQuestion.id,
                    content: content as string,
                    isCorrect: idx === correctOptionIndex,
                }));
                await db.insert(optionsTable).values(optionsToInsert);
            }
        }

        revalidatePath("/dashboard/bank-soal");
        return {
            success: true,
            message: finalStatus === "PENDING"
                ? "Question submitted for approval"
                : "Question created successfully"
        };
    } catch (error) {
        console.error("Failed to create question:", error);
        return { success: false, message: "Failed to create question" };
    }
}

export async function updateQuestion(id: number, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });

    if (!currentUser) {
        return { success: false, message: "User not found" };
    }
    if (currentUser.role === "peserta") {
        return { success: false, message: "Peserta hanya boleh mengerjakan ujian." };
    }

    const requestedStatus = (formData.get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";

    // Authorization check for status update
    let finalStatus = requestedStatus;
    if (currentUser.role === "pembina" && requestedStatus === "PUBLISHED") {
        finalStatus = "PENDING"; // Pembina cannot publish directly
    }

    const topicRaw = (formData.get("topic") as string) || "";
    const rawData = {
        content: formData.get("content") as string,
        type: formData.get("type") as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
        topic: normalizeTopic(topicRaw.trim()) || "General",
        subtopic: formData.get("subtopic") as string,
        difficulty: formData.get("difficulty") as "EASY" | "MEDIUM" | "HARD",
        source: formData.get("source") as string,
        year: parseInt(formData.get("year") as string) || new Date().getFullYear(),
        explanation: formData.get("explanation") as string,
        status: finalStatus,
        // Scoring fields
        weight: parseFloat(formData.get("weight") as string) || 1,
        answerKeys: JSON.parse((formData.get("answer_keys") as string) || "[]"),
        rubric: JSON.parse((formData.get("rubric") as string) || "[]"),
    };

    try {
        await db.update(questions).set(rawData).where(eq(questions.id, id));

        // Basic full replacement logic for options (easier than diffing)
        if (rawData.type === "MULTIPLE_CHOICE") {
            // Delete existing options
            await db.delete(optionsTable).where(eq(optionsTable.questionId, id));

            const optionsContent = formData.getAll("option_content");
            const correctOptionIndex = parseInt(formData.get("correct_option") as string);

            if (optionsContent.length > 0) {
                const optionsToInsert = optionsContent.map((content, idx) => ({
                    questionId: id,
                    content: content as string,
                    isCorrect: idx === correctOptionIndex,
                }));
                await db.insert(optionsTable).values(optionsToInsert);
            }
        }

        revalidatePath("/dashboard/bank-soal");
        return {
            success: true,
            message: finalStatus === "PENDING"
                ? "Question updated and submitted for approval"
                : "Question updated successfully"
        };
    } catch (error) {
        console.error("Failed to update question:", error);
        return { success: false, message: "Failed to update question" };
    }
}

export async function deleteQuestion(id: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (currentUser?.role === "peserta") return { success: false, message: "Peserta hanya boleh mengerjakan ujian." };
    try {
        await db.delete(optionsTable).where(eq(optionsTable.questionId, id));
        await db.delete(questions).where(eq(questions.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete question:", error);
        return { success: false, message: "Failed to delete question" };
    }
}

export async function updateQuestionStatus(id: number, status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (!currentUser) return { success: false, message: "User not found" };
    if (status === "PUBLISHED" && currentUser.role !== "admin") {
        return { success: false, message: "Hanya admin yang dapat menerbitkan (publish) soal." };
    }
    if (currentUser.role === "peserta") return { success: false, message: "Peserta hanya boleh mengerjakan ujian." };
    try {
        await db.update(questions).set({ status }).where(eq(questions.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true, message: "Status updated." };
    } catch (error) {
        console.error("Failed to update question status:", error);
        return { success: false, message: "Failed to update status." };
    }
}

export async function approveQuestion(id: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });

    if (currentUser?.role !== "admin") {
        return { success: false, message: "Only admin can approve questions" };
    }

    try {
        await db.update(questions).set({ status: "PUBLISHED" }).where(eq(questions.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true, message: "Question approved and published" };
    } catch (error) {
        console.error("Failed to approve question:", error);
        return { success: false, message: "Failed to approve question" };
    }
}

export async function rejectQuestion(id: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });

    if (currentUser?.role !== "admin") {
        return { success: false, message: "Only admin can reject questions" };
    }

    try {
        await db.update(questions).set({ status: "DRAFT" }).where(eq(questions.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true, message: "Question rejected and returned to draft" };
    } catch (error) {
        console.error("Failed to reject question:", error);
        return { success: false, message: "Failed to reject question" };
    }
}
