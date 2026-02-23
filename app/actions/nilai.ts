"use server";

import { db } from "@/lib/db";
import { examSessions, examAnswers, questions, options, users, exams, examQuestions } from "@/lib/schema";
import { eq, and, desc, inArray, sql, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Filters interface for getStudentExamSessions
interface ExamSessionFilters {
    studentId?: number;
    examId?: number;
    startDate?: Date;
    endDate?: Date;
    hasFeedback?: boolean;
    page?: number;
    limit?: number;
}

/**
 * Get all student exam sessions with filtering and pagination
 * For pembina to view and manage student grades and feedback
 */
export async function getStudentExamSessions(filters: ExamSessionFilters = {}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };

        // Check if user is pembina
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "pembina" && currentUser?.role !== "admin") {
            console.error("Unauthorized access to nilai page");
            return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        }

        const { studentId, examId, startDate, endDate, hasFeedback, page: rawPage = 1, limit: rawLimit = 20 } = filters;
        const limit = Math.max(1, Math.min(100, rawLimit));
        const page = Math.max(1, rawPage);

        // Build where conditions
        const conditions = [eq(examSessions.status, "COMPLETED")];

        if (studentId) {
            conditions.push(sql`${examSessions.userId} = ${String(studentId)}`);
        }

        if (examId) {
            conditions.push(eq(examSessions.examId, examId));
        }

        if (startDate) {
            conditions.push(gte(examSessions.endTime, startDate));
        }

        if (endDate) {
            conditions.push(lte(examSessions.endTime, endDate));
        }

        if (hasFeedback === true) {
            conditions.push(isNotNull(examSessions.feedback));
        } else if (hasFeedback === false) {
            conditions.push(isNull(examSessions.feedback));
        }

        // Get total count
        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(and(...conditions));

        const total = Number(countResult?.count || 0);
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Get paginated data with joins
        const sessionsData = await db
            .select({
                sessionId: examSessions.id,
                userId: examSessions.userId,
                examId: examSessions.examId,
                score: examSessions.score,
                endTime: examSessions.endTime,
                feedback: examSessions.feedback,
                totalQuestions: examSessions.totalQuestions,
                correctAnswers: examSessions.correctAnswers,
                studentName: users.name,
                studentEmail: users.email,
                examTitle: exams.title,
                examCategory: exams.category,
            })
            .from(examSessions)
            .leftJoin(users, sql`${users.id} = ${examSessions.userId}`)
            .leftJoin(exams, eq(examSessions.examId, exams.id))
            .where(and(...conditions))
            .orderBy(desc(examSessions.endTime))
            .limit(limit)
            .offset(offset);

        return {
            data: sessionsData,
            total,
            page,
            limit,
            totalPages,
        };
    } catch (error) {
        console.error("Failed to fetch student exam sessions:", error);
        return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
}

/**
 * Get detailed exam session with all questions and answers
 * For pembina to review student performance question-by-question
 */
export async function getExamSessionDetail(sessionId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        // Check if user is pembina
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "pembina" && currentUser?.role !== "admin") {
            console.error("Unauthorized access to exam session detail");
            return null;
        }

        // Get exam session
        const examSession = await db.query.examSessions.findFirst({
            where: eq(examSessions.id, sessionId),
        });

        if (!examSession || examSession.status !== "COMPLETED") {
            return null;
        }

        // Get student info
        const student = await db.query.users.findFirst({
            where: sql`${users.id} = ${examSession.userId}`,
        });

        // Get exam info
        const [exam] = await db.select().from(exams).where(eq(exams.id, examSession.examId));

        // Get question order
        let qIds: number[] = [];
        if (examSession.questionOrder && Array.isArray(examSession.questionOrder)) {
            qIds = examSession.questionOrder as number[];
        } else {
            // Fallback: get from exam_questions table
            const examQs = await db
                .select()
                .from(examQuestions)
                .where(eq(examQuestions.examId, examSession.examId))
                .orderBy(examQuestions.order);
            qIds = examQs.map((q) => q.questionId);
        }

        if (qIds.length === 0) {
            return null;
        }

        // Get questions, options, and answers
        const questionsData = await db.select().from(questions).where(inArray(questions.id, qIds));
        const optionsData = await db.select().from(options).where(inArray(options.questionId, qIds));
        const answersData = await db.select().from(examAnswers).where(eq(examAnswers.sessionId, sessionId));

        // Map data together
        const detailedResults = qIds.map((qId, index) => {
            const question = questionsData.find((q) => q.id === qId);
            const userAns = answersData.find((a) => a.questionId === qId);
            const questionOptions = optionsData.filter((o) => o.questionId === qId);
            const correctOption = questionOptions.find((o) => o.isCorrect);

            return {
                questionNumber: index + 1,
                id: question?.id || 0,
                content: question?.content || "Content not available", // Fallback content
                type: question?.type || "MULTIPLE_CHOICE", // Fallback type
                topic: question?.topic || null,
                subtopic: question?.subtopic || null,
                difficulty: question?.difficulty || "MEDIUM",
                explanation: question?.explanation || null,
                options: questionOptions.map((opt) => ({
                    id: opt.id,
                    content: opt.content,
                    isCorrect: opt.isCorrect,
                })),
                userAnswer: userAns?.answer || null,
                isCorrect: userAns?.isCorrect || null,
                correctAnswerId: correctOption?.id,
                correctAnswerContent: correctOption?.content,
            };
        });

        return {
            session: {
                id: examSession.id,
                score: examSession.score,
                endTime: examSession.endTime,
                feedback: examSession.feedback,
                totalQuestions: examSession.totalQuestions,
                correctAnswers: examSession.correctAnswers,
            },
            student: {
                id: student?.id,
                name: student?.name,
                email: student?.email,
            },
            exam: {
                id: exam?.id,
                title: exam?.title,
                category: exam?.category,
                duration: exam?.duration,
            },
            results: detailedResults,
        };
    } catch (error) {
        console.error("Failed to fetch exam session detail:", error);
        return null;
    }
}

/**
 * Submit or update feedback for an exam session
 * For pembina to provide personalized feedback to students
 */
export async function submitFeedback(sessionId: number, feedbackText: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        // Check if user is pembina
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "pembina" && currentUser?.role !== "admin") {
            return { success: false, message: "Only pembina can submit feedback" };
        }

        // Validate feedback length
        if (feedbackText.length > 1000) {
            return { success: false, message: "Feedback must be 1000 characters or less" };
        }

        // Update feedback
        await db
            .update(examSessions)
            .set({
                feedback: feedbackText.trim() || null,
            })
            .where(eq(examSessions.id, sessionId));

        revalidatePath("/dashboard/nilai");

        return { success: true, message: "Feedback saved successfully" };
    } catch (error) {
        console.error("Failed to submit feedback:", error);
        return { success: false, message: "Failed to save feedback" };
    }
}

/**
 * Get statistics for the nilai dashboard
 * Summary cards showing overall performance metrics
 */
export async function getNilaiStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        // Check if user is pembina
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "pembina" && currentUser?.role !== "admin") {
            return null;
        }

        // Total completed sessions
        const [totalSessions] = await db
            .select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(eq(examSessions.status, "COMPLETED"));

        // Sessions with feedback
        const [withFeedback] = await db
            .select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(and(eq(examSessions.status, "COMPLETED"), isNotNull(examSessions.feedback)));

        // Average class score
        const [avgScore] = await db
            .select({ avg: sql<number>`avg(${examSessions.score})` })
            .from(examSessions)
            .where(eq(examSessions.status, "COMPLETED"));

        // Pending feedback count
        const pendingFeedback = (totalSessions?.count || 0) - (withFeedback?.count || 0);

        return {
            totalSessions: totalSessions?.count || 0,
            withFeedback: withFeedback?.count || 0,
            pendingFeedback,
            avgClassScore: avgScore?.avg ? Number(avgScore.avg).toFixed(1) : "0.0",
        };
    } catch (error) {
        console.error("Failed to fetch nilai stats:", error);
        return null;
    }
}

/**
 * Get list of students for filter dropdown
 */
export async function getStudentsForFilter() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const students = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users)
            .where(eq(users.role, "peserta"))
            .orderBy(users.name);

        return students;
    } catch (error) {
        console.error("Failed to fetch students:", error);
        return [];
    }
}

/**
 * Get list of exams for filter dropdown
 */
export async function getExamsForFilter() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const examsList = await db
            .select({
                id: exams.id,
                title: exams.title,
                category: exams.category,
            })
            .from(exams)
            .where(eq(exams.isActive, true))
            .orderBy(desc(exams.createdAt));

        return examsList;
    } catch (error) {
        console.error("Failed to fetch exams:", error);
        return [];
    }
}
