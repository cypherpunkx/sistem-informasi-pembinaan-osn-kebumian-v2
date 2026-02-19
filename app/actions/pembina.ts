"use server";

import { db } from "@/lib/db";
import { users, materials, examSessions, userProgress } from "@/lib/schema";
import { eq, and, desc, count, avg, sql, isNotNull, gte, lt } from "drizzle-orm";
import { auth } from "@/auth";

export async function getPembinaStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        // Count total students (peserta)
        const [studentCount] = await db
            .select({ count: count() })
            .from(users)
            .where(eq(users.role, "peserta"));

        // Count materials uploaded (all statuses)
        const [materialCount] = await db
            .select({ count: count() })
            .from(materials);

        // Count pending materials (PENDING or DRAFT status)
        const [pendingCount] = await db
            .select({ count: count() })
            .from(materials)
            .where(sql`${materials.status} IN ('PENDING', 'DRAFT')`);

        // Calculate average class score from completed exam sessions
        const [avgScoreResult] = await db
            .select({ avgScore: avg(examSessions.score) })
            .from(examSessions)
            .where(eq(examSessions.status, "COMPLETED"));

        // Pending feedback: sesi selesai yang belum ada feedback (selaras dengan halaman Nilai & Feedback)
        const [totalCompleted] = await db
            .select({ count: count() })
            .from(examSessions)
            .where(eq(examSessions.status, "COMPLETED"));
        const [withFeedback] = await db
            .select({ count: count() })
            .from(examSessions)
            .where(and(eq(examSessions.status, "COMPLETED"), isNotNull(examSessions.feedback)));
        const pendingFeedback = (totalCompleted?.count ?? 0) - (withFeedback?.count ?? 0);

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const [avgThisWeek] = await db
            .select({ avgScore: avg(examSessions.score) })
            .from(examSessions)
            .where(and(eq(examSessions.status, "COMPLETED"), gte(examSessions.endTime, sevenDaysAgo)));
        const [avgLastWeek] = await db
            .select({ avgScore: avg(examSessions.score) })
            .from(examSessions)
            .where(
                and(
                    eq(examSessions.status, "COMPLETED"),
                    gte(examSessions.endTime, fourteenDaysAgo),
                    lt(examSessions.endTime, sevenDaysAgo)
                )
            );
        const thisW = avgThisWeek?.avgScore != null ? Number(avgThisWeek.avgScore) : null;
        const lastW = avgLastWeek?.avgScore != null ? Number(avgLastWeek.avgScore) : null;
        const avgClassScoreTrend: number | null =
            lastW != null && lastW > 0 && thisW != null ? Math.round(((thisW - lastW) / lastW) * 100) : null;

        return {
            totalStudents: studentCount?.count || 0,
            totalMaterials: materialCount?.count || 0,
            pendingReviews: pendingCount?.count || 0,
            pendingFeedback,
            avgClassScore: avgScoreResult?.avgScore ? Number(avgScoreResult.avgScore).toFixed(1) : "0.0",
            avgClassScoreTrend,
        };
    } catch (error) {
        console.error("Failed to fetch pembina stats:", error);
        return null;
    }
}

export async function getStudentProgress() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Total materi PUBLISHED (selaras dengan Arsip Materi peserta)
        const [totalPublishedMaterials] = await db
            .select({ count: count() })
            .from(materials)
            .where(eq(materials.status, "PUBLISHED"));

        const totalMaterials = totalPublishedMaterials?.count ?? 0;

        // Get recent student activity
        const studentsData = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                lastActive: users.updatedAt,
            })
            .from(users)
            .where(eq(users.role, "peserta"))
            .orderBy(desc(users.updatedAt))
            .limit(10);

        // Per siswa: progress materi (selesai / total PUBLISHED), rata-rata nilai ujian
        const studentsWithStats = await Promise.all(
            studentsData.map(async (student) => {
                const userIdStr = String(student.id);

                // Progress Materi: user_progress.isCompleted / total materi PUBLISHED
                const [completedMaterials] = await db
                    .select({ count: count() })
                    .from(userProgress)
                    .where(
                        and(
                            eq(userProgress.userId, userIdStr),
                            eq(userProgress.isCompleted, true)
                        )
                    );

                const completed = completedMaterials?.count ?? 0;
                const progress =
                    totalMaterials > 0
                        ? Math.min(100, Math.round((completed / totalMaterials) * 100))
                        : 0;

                // Rata-rata nilai ujian (tetap dari exam sessions)
                const [avgScore] = await db
                    .select({ avgScore: avg(examSessions.score) })
                    .from(examSessions)
                    .where(
                        and(
                            sql`${examSessions.userId} = ${userIdStr}`,
                            eq(examSessions.status, "COMPLETED")
                        )
                    );

                return {
                    id: student.id,
                    name: student.name || student.email,
                    progress,
                    avgScore: avgScore?.avgScore ? Number(avgScore.avgScore).toFixed(1) : "0",
                    lastActive: student.lastActive,
                };
            })
        );

        return studentsWithStats;
    } catch (error) {
        console.error("Failed to fetch student progress:", error);
        return [];
    }
}
