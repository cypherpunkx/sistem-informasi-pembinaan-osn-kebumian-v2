"use server";

import { db } from "@/lib/db";
import { users, questions, materials, exams } from "@/lib/schema";
import { sql, eq, gte } from "drizzle-orm";
import { auth } from "@/auth";

/**
 * Get admin dashboard statistics
 * Admin only
 */
export async function getAdminDashboardStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const currentUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return null;
        }

        // Total users
        const [totalUsersResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users);

        // Total questions
        const [totalQuestionsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions);

        // Total materials
        const [totalMaterialsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(materials);

        // Active exams (definitions with isActive = true, consistent with getExamsFiltered)
        const [activeExamsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(exams)
            .where(eq(exams.isActive, true));

        // User growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [newUsersResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(gte(users.createdAt, thirtyDaysAgo));

        // Questions by status
        const [publishedQuestionsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(sql`${questions.status} = 'PUBLISHED'`);

        const [draftQuestionsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(sql`${questions.status} = 'DRAFT'`);

        // Materials by status
        const [publishedMaterialsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(materials)
            .where(sql`${materials.status} = 'PUBLISHED'`);

        return {
            totalUsers: Number(totalUsersResult?.count || 0),
            totalQuestions: Number(totalQuestionsResult?.count || 0),
            totalMaterials: Number(totalMaterialsResult?.count || 0),
            activeExams: Number(activeExamsResult?.count || 0),
            newUsers30Days: Number(newUsersResult?.count || 0),
            publishedQuestions: Number(publishedQuestionsResult?.count || 0),
            draftQuestions: Number(draftQuestionsResult?.count || 0),
            publishedMaterials: Number(publishedMaterialsResult?.count || 0),
        };
    } catch (error) {
        console.error("Failed to fetch admin dashboard stats:", error);
        return null;
    }
}

/**
 * Get pembina dashboard statistics
 * Pembina only
 */
export async function getPembinaDashboardStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const currentUser = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "pembina") {
            return null;
        }

        // Total students (peserta)
        const [totalStudentsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(sql`${users.role} = 'peserta'`);

        // Total exams (all exams in system)
        const [totalExamsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(exams);

        // Active exams (definitions with isActive = true, consistent with getExamsFiltered)
        const [activeExamsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(exams)
            .where(eq(exams.isActive, true));

        return {
            totalStudents: Number(totalStudentsResult?.count || 0),
            totalExams: Number(totalExamsResult?.count || 0),
            activeExams: Number(activeExamsResult?.count || 0),
        };
    } catch (error) {
        console.error("Failed to fetch pembina dashboard stats:", error);
        return null;
    }
}
