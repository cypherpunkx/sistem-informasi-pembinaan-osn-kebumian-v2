"use server";

import { db } from "@/lib/db";
import { userProgress, materials, examSessions, exams } from "@/lib/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getUserStats(userId?: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const targetUserId = userId || currentUserId;

    if (!targetUserId) return null;

    try {
        // 1. Material Progress
        // Count total materials
        const materialCountQuery = await db.select({ count: sql<number>`count(*)` }).from(materials);
        const totalMaterials = materialCountQuery[0].count;

        // Count completed materials
        const completedMaterialsQuery = await db.select({ count: sql<number>`count(*)` })
            .from(userProgress)
            .where(and(eq(userProgress.userId, targetUserId), eq(userProgress.isCompleted, true)));
        const completedMaterials = completedMaterialsQuery[0].count;

        // 2. Exam Stats
        // Exams taken (completed sessions)
        const examsTakenQuery = await db.select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(and(eq(examSessions.userId, targetUserId), eq(examSessions.status, "COMPLETED")));
        const examsTaken = examsTakenQuery[0].count;

        // Average Score
        const avgScoreQuery = await db.select({ avg: sql<number>`avg(${examSessions.score})` })
            .from(examSessions)
            .where(and(eq(examSessions.userId, targetUserId), eq(examSessions.status, "COMPLETED")));
        const averageScore = Math.round(Number(avgScoreQuery[0].avg) || 0);

        // 3. Category Performance (Requires joining with exams table)
        const categoryPerformance = await db.select({
            category: exams.category,
            avgScore: sql<number>`round(avg(${examSessions.score}))`
        })
            .from(examSessions)
            .innerJoin(exams, eq(examSessions.examId, exams.id))
            .where(and(eq(examSessions.userId, targetUserId), eq(examSessions.status, "COMPLETED")))
            .groupBy(exams.category);

        // 4. Weekly Activity (Last 7 days exams)
        const onewWeekAgo = new Date();
        onewWeekAgo.setDate(onewWeekAgo.getDate() - 7);

        const weeklyActivity = await db.select({
            date: sql<string>`DATE(${examSessions.endTime})`,
            count: sql<number>`count(*)`
        })
            .from(examSessions)
            .where(and(
                eq(examSessions.userId, targetUserId),
                eq(examSessions.status, "COMPLETED"),
                gte(examSessions.endTime, onewWeekAgo)
            ))
            .groupBy(sql`DATE(${examSessions.endTime})`)
            .orderBy(sql`DATE(${examSessions.endTime})`);

        return {
            materials: {
                total: totalMaterials,
                completed: completedMaterials,
                percentage: totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0
            },
            exams: {
                totalTaken: examsTaken,
                averageScore
            },
            categoryPerformance,
            weeklyActivity
        };

    } catch (error) {
        console.error("Failed to fetch user stats:", error);
        return null;
    }
}

export async function markMaterialComplete(materialId: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, message: "Unauthorized" };

    try {
        const existing = await db.select().from(userProgress).where(and(eq(userProgress.userId, userId), eq(userProgress.materialId, materialId)));

        if (existing.length > 0) {
            await db.update(userProgress).set({
                isCompleted: true,
                completedAt: new Date(),
                lastAccessedAt: new Date()
            }).where(eq(userProgress.id, existing[0].id));
        } else {
            await db.insert(userProgress).values({
                userId,
                materialId,
                isCompleted: true,
                completedAt: new Date(),
                lastAccessedAt: new Date()
            });
        }

        revalidatePath("/dashboard/materi");
        revalidatePath("/dashboard"); // Update Main Dashboard

        return { success: true };
    } catch (error) {
        console.error("Failed to mark material complete:", error);
        return { success: false };
    }
}
