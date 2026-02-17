"use server";

import { db } from "@/lib/db";
import { users, materials, examSessions, exams } from "@/lib/schema";
import { eq, and, desc, count, avg, sql } from "drizzle-orm";
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

        return {
            totalStudents: studentCount?.count || 0,
            totalMaterials: materialCount?.count || 0,
            pendingReviews: pendingCount?.count || 0,
            avgClassScore: avgScoreResult?.avgScore ? Number(avgScoreResult.avgScore).toFixed(1) : "0.0",
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

        // Get recent student activity with exam scores
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

        // For each student, get their exam stats
        const studentsWithStats = await Promise.all(
            studentsData.map(async (student) => {
                const userIdStr = String(student.id);

                // Get average exam score
                const [avgScore] = await db
                    .select({ avgScore: avg(examSessions.score) })
                    .from(examSessions)
                    .where(
                        and(
                            sql`${examSessions.userId} = ${userIdStr}`,
                            eq(examSessions.status, "COMPLETED")
                        )
                    );

                // Get total completed exams
                const [completedExams] = await db
                    .select({ count: count() })
                    .from(examSessions)
                    .where(
                        and(
                            sql`${examSessions.userId} = ${userIdStr}`,
                            eq(examSessions.status, "COMPLETED")
                        )
                    );

                // Get total available exams
                const [totalExams] = await db
                    .select({ count: count() })
                    .from(exams)
                    .where(eq(exams.isActive, true));

                const progress = totalExams?.count
                    ? Math.min(100, Math.round(((completedExams?.count || 0) / totalExams.count) * 100))
                    : 0;

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
