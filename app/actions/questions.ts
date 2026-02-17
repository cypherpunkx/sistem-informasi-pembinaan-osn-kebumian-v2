"use server";

import { db } from "@/lib/db";
import { questions, options as optionsTable, users } from "@/lib/schema";
import { eq, desc, inArray, like, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// ... imports

export async function getQuestions(filter?: { topic?: string; type?: string; search?: string; status?: string }) {
    const session = await auth();
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session?.user?.id || "0")),
    });

    const conditions = [];

    // Filter by topic
    if (filter?.topic && filter.topic !== "All") {
        conditions.push(eq(questions.topic, filter.topic));
    }
    // Filter by type
    if (filter?.type && filter.type !== "All") {
        conditions.push(eq(questions.type, filter.type as any));
    }
    // Filter by status
    if (filter?.status && filter.status !== "All") {
        conditions.push(eq(questions.status, filter.status as any));
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
            // @ts-ignore - CreatedBy relation might not be defined in schema relations yet but column exists
            // We can add relation later if needed for displaying author name
        }
    });

    // Manual join for author name if needed, or query separate. 
    // For now return data.
    return data;
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

export async function createQuestion(prevState: any, formData: FormData) {
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

    const requestedStatus = (formData.get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";

    // Authorization check for status
    let finalStatus = requestedStatus;
    if (currentUser.role === "pembina" && requestedStatus === "PUBLISHED") {
        finalStatus = "PENDING"; // Pembina cannot publish directly
    }

    const rawData = {
        content: formData.get("content") as string,
        type: formData.get("type") as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
        topic: formData.get("topic") as string,
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

    const requestedStatus = (formData.get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";

    // Authorization check for status update
    let finalStatus = requestedStatus;
    if (currentUser.role === "pembina" && requestedStatus === "PUBLISHED") {
        finalStatus = "PENDING"; // Pembina cannot publish directly
    }

    const rawData = {
        content: formData.get("content") as string,
        type: formData.get("type") as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
        topic: formData.get("topic") as string,
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
    try {
        await db.update(questions).set({ status }).where(eq(questions.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true, message: "Status updated." };
    } catch (error) {
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
