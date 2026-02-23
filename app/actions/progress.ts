"use server";

import { db } from "@/lib/db";
import { userProgress, materials, examSessions, exams } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getUserStats(userId?: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const targetUserId = userId || currentUserId;

    if (!targetUserId) return null;

    try {
        // 1. Material Progress (hanya materi PUBLISHED agar persentase = selesai / yang bisa dikerjakan)
        const materialCountQuery = await db
            .select({ count: sql<number>`count(*)` })
            .from(materials)
            .where(eq(materials.status, "PUBLISHED"));
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

        // Average Score & Best Score
        const avgScoreQuery = await db.select({ avg: sql<number>`avg(${examSessions.score})` })
            .from(examSessions)
            .where(and(eq(examSessions.userId, targetUserId), eq(examSessions.status, "COMPLETED")));
        const averageScore = Math.round(Number(avgScoreQuery[0].avg) || 0);

        const bestScoreQuery = await db.select({ max: sql<number>`max(${examSessions.score})` })
            .from(examSessions)
            .where(and(eq(examSessions.userId, targetUserId), eq(examSessions.status, "COMPLETED")));
        const bestScore = Number(bestScoreQuery[0].max) || 0;

        // 3. Category Performance (Requires joining with exams table)
        const categoryPerformance = await db.select({
            category: exams.category,
            avgScore: sql<number>`round(avg(${examSessions.score}))`
        })
            .from(examSessions)
            .innerJoin(exams, eq(examSessions.examId, exams.id))
            .where(and(eq(examSessions.userId, targetUserId), eq(examSessions.status, "COMPLETED")))
            .groupBy(exams.category);

        // 4. Weekly Activity: selalu 7 hari terakhir (hari tanpa aktivitas = 0), scalable
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const rawWeekly = await db.select({
            date: sql<string>`DATE(${examSessions.endTime})`,
            count: sql<number>`count(*)`
        })
            .from(examSessions)
            .where(and(
                eq(examSessions.userId, targetUserId),
                eq(examSessions.status, "COMPLETED"),
                gte(examSessions.endTime, oneWeekAgo)
            ))
            .groupBy(sql`DATE(${examSessions.endTime})`)
            .orderBy(sql`DATE(${examSessions.endTime})`);

        const countByDate = new Map(rawWeekly.map((r) => [r.date, Number(r.count)]));
        const weeklyActivity: { date: string; count: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(oneWeekAgo);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const dateStr = `${y}-${m}-${day}`;
            weeklyActivity.push({ date: dateStr, count: countByDate.get(dateStr) ?? 0 });
        }

        return {
            materials: {
                total: totalMaterials,
                completed: completedMaterials,
                percentage: totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0
            },
            exams: {
                totalTaken: examsTaken,
                averageScore,
                bestScore
            },
            categoryPerformance,
            weeklyActivity
        };

    } catch (error) {
        console.error("Failed to fetch user stats:", error);
        return null;
    }
}

export async function getCompletedMaterialIds(userId: string): Promise<number[]> {
    if (!userId) return [];
    try {
        const rows = await db
            .select({ materialId: userProgress.materialId })
            .from(userProgress)
            .where(and(eq(userProgress.userId, userId), eq(userProgress.isCompleted, true)));
        return rows.map((r) => r.materialId);
    } catch (error) {
        console.error("Failed to fetch completed material IDs:", error);
        return [];
    }
}

export async function markMaterialComplete(materialId: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, message: "Unauthorized" };

    try {
        const [material] = await db.select({ id: materials.id, status: materials.status }).from(materials).where(eq(materials.id, materialId)).limit(1);
        if (!material) return { success: false, message: "Materi tidak ditemukan." };
        if (material.status !== "PUBLISHED") return { success: false, message: "Hanya materi yang sudah dipublikasikan dapat ditandai selesai." };

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
        revalidatePath("/dashboard/progres");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Failed to mark material complete:", error);
        return { success: false };
    }
}
