"use server";

import { db } from "@/lib/db";
import { exams, examQuestions, questions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { fisherYatesShuffle } from "@/lib/utils";

export async function createTopicPracticeExam(
    topic: string,
    questionLimit = 10
): Promise<{ success: boolean; examId?: number; message?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
        return { success: false, message: "Topik tidak valid." };
    }

    try {
        const questionRows = await db
            .select({ id: questions.id })
            .from(questions)
            .where(and(
                eq(questions.topic, trimmedTopic),
                eq(questions.status, "PUBLISHED")
            ));

        if (questionRows.length === 0) {
            return { success: false, message: "Belum ada soal untuk topik ini." };
        }

        const questionIds = questionRows.map((q) => q.id);
        const shuffledIds = fisherYatesShuffle(questionIds).slice(0, questionLimit);
        const duration = Math.max(5, shuffledIds.length);

        const [result] = await db
            .insert(exams)
            .values({
                title: `Latihan Topik: ${trimmedTopic}`,
                description: `Latihan soal bertopik ${trimmedTopic}. Soal dipilih secara acak dari bank soal.`,
                duration,
                type: "FIXED",
                category: "Latihan Topik",
                isActive: true,
            })
            .$returningId();

        const examId = result.id;

        const examQuestionValues = shuffledIds.map((qId, index) => ({
            examId,
            questionId: qId,
            order: index + 1,
        }));

        await db.insert(examQuestions).values(examQuestionValues);

        revalidatePath("/dashboard/latihan-ujian");
        revalidatePath("/dashboard");

        return { success: true, examId };
    } catch (error) {
        console.error("Failed to create topic practice exam:", error);
        return { success: false, message: "Gagal membuat latihan. Silakan coba lagi." };
    }
}

export async function getQuestionCountByTopic(topic: string): Promise<number> {
    try {
        const rows = await db
            .select({ id: questions.id })
            .from(questions)
            .where(and(
                eq(questions.topic, topic.trim()),
                eq(questions.status, "PUBLISHED")
            ));
        return rows.length;
    } catch {
        return 0;
    }
}
