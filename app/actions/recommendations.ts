"use server";

import { db } from "@/lib/db";
import { questions, examAnswers, examSessions, materials } from "@/lib/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
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
    materials: any[];
}

export async function getTopicAccuracy(): Promise<TopicAccuracy[]> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    try {
        // 1. Get all answers for this user
        // We need to join examAnswers -> examSessions to filter by userId
        // Then join questions to get topic

        const rows = await db.select({
            topic: questions.topic,
            isCorrect: examAnswers.isCorrect,
        })
            .from(examAnswers)
            .innerJoin(examSessions, eq(examAnswers.sessionId, examSessions.id))
            .innerJoin(questions, eq(examAnswers.questionId, questions.id))
            .where(eq(examSessions.userId, userId));

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

export async function getRecommendations(): Promise<Recommendation[]> {
    const accuracyData = await getTopicAccuracy();

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
        let relatedMaterials: any[] = [];
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
