"use server";

import { db } from "@/lib/db";
import { questions, examAnswers, examSessions, materials } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export interface TopicAccuracy {
    topic: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number; // Percentage 0-100
    priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface Recommendation {
    topic: string;
    accuracy: number;
    priority: "HIGH" | "MEDIUM" | "LOW";
    message: string;
    materials: { id: number; title: string; url: string | null; topic: string; type: string; status: string; createdAt: Date | null }[];
}

/** Get topic accuracy for a user. If userId is passed, caller must be pembina/admin; otherwise uses current user. */
export async function getTopicAccuracy(requestedUserId?: string): Promise<TopicAccuracy[]> {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const role = session?.user?.role as string | undefined;

    const userId = requestedUserId ?? currentUserId;
    if (!userId) return [];
    if (requestedUserId && requestedUserId !== currentUserId && role !== "pembina" && role !== "admin") return [];

    try {
        const rows = await db.select({
            topic: questions.topic,
            isCorrect: examAnswers.isCorrect,
        })
            .from(examAnswers)
            .innerJoin(examSessions, eq(examAnswers.sessionId, examSessions.id))
            .innerJoin(questions, eq(examAnswers.questionId, questions.id))
            .where(and(eq(examSessions.userId, String(userId)), eq(examSessions.status, "COMPLETED")));

        // 2. Aggregate manually (Drizzle groupBy is sometimes tricky with simple selects, doing in JS for flexibility)
        const accMap = new Map<string, { total: number; correct: number }>();

        for (const row of rows) {
            const topic = row.topic || "Uncategorized";
            if (!accMap.has(topic)) {
                accMap.set(topic, { total: 0, correct: 0 });
            }
            const data = accMap.get(topic)!;
            data.total++;
            if (row.isCorrect) data.correct++;
        }

        // 3. Calculate Accuracy & Priority
        const results: TopicAccuracy[] = [];
        accMap.forEach((data, topic) => {
            const accuracy = (data.correct / data.total) * 100;
            let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";

            if (accuracy < 50) priority = "HIGH";
            else if (accuracy < 80) priority = "MEDIUM";

            results.push({
                topic,
                totalQuestions: data.total,
                correctAnswers: data.correct,
                accuracy,
                priority
            });
        });

        // Dummy data hanya bila belum ada data ujian, agar tidak duplikat dengan topik dari DB (e.g. Geology vs Geologi)
        if (results.length === 0) {
            results.push({
                topic: "Kebumian: Geologi",
                totalQuestions: 15,
                correctAnswers: 7,
                accuracy: 46.7,
                priority: "HIGH"
            });
            results.push({
                topic: "Kebumian: Meteorologi",
                totalQuestions: 10,
                correctAnswers: 5,
                accuracy: 50,
                priority: "MEDIUM"
            });
            results.push({
                topic: "Kebumian: Oseanografi",
                totalQuestions: 8,
                correctAnswers: 6,
                accuracy: 75,
                priority: "MEDIUM"
            });
        }

        // Sort by Priority (High first) then Accuracy (Ascending)
        return results.sort((a, b) => {
            const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.accuracy - b.accuracy;
        });

    } catch (error) {
        console.error("Failed to get topic accuracy:", error);
        return [];
    }
}

export async function getRecommendations(requestedUserId?: string): Promise<Recommendation[]> {
    const accuracyData = await getTopicAccuracy(requestedUserId);

    // Filter only High and Medium priority for recommendations
    // or return all if we want to show full status

    // Let's create recommendations tailored to priority
    const recommendations: Recommendation[] = [];

    for (const item of accuracyData) {
        let message = "";
        if (item.priority === "HIGH") {
            message = "Perlu latihan intensif dan review materi.";
        } else if (item.priority === "MEDIUM") {
            message = "Latihan tambahan disarankan.";
        } else {
            message = "Pertahankan performa ini!";
        }

        // Fetch related materials for High/Medium priority
        let relatedMaterials: { id: number; title: string; url: string | null; topic: string; type: string; status: string; createdAt: Date | null }[] = [];
        if (item.priority !== "LOW") {
            relatedMaterials = await db.select()
                .from(materials)
                .where(and(
                    eq(materials.topic, item.topic),
                    eq(materials.status, "PUBLISHED")
                ))
                .limit(3);
        }

        recommendations.push({
            topic: item.topic,
            accuracy: item.accuracy,
            priority: item.priority,
            message,
            materials: relatedMaterials
        });
    }

    return recommendations;
}
