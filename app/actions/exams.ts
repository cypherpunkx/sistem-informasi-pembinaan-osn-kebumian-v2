"use server";

import { db } from "@/lib/db";
import { exams, examQuestions, examSessions, examAnswers, questions, options } from "@/lib/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { calculateQuestionScore, ScoringResult } from "@/lib/scoring";

// --- Exam Management (Admin/Pembina) ---

export async function getExams() {
    try {
        const data = await db.select().from(exams).orderBy(desc(exams.createdAt));
        return data;
    } catch (error) {
        console.error("Failed to fetch exams:", error);
        return [];
    }
}

export async function createFixedExam(prevState: any, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string);
    const category = formData.get("category") as string;
    const questionIdsRaw = formData.get("questionIds") as string; // Comma separated IDs

    if (!title || !duration || !questionIdsRaw) {
        return { message: "Missing required fields" };
    }

    const questionIds = questionIdsRaw.split(",").map(id => parseInt(id.trim()));

    try {
        // Validate Question Status
        const selectedQuestions = await db.select({ id: questions.id, status: questions.status })
            .from(questions)
            .where(inArray(questions.id, questionIds));

        const invalidQuestions = selectedQuestions.filter(q => q.status !== "PUBLISHED");

        if (invalidQuestions.length > 0) {
            return { message: `Cannot create exam. ${invalidQuestions.length} selected questions are not PUBLISHED (e.g. pending approval).` };
        }

        // 1. Create Exam
        const [result] = await db.insert(exams).values({
            title,
            description,
            duration,
            type: "FIXED",
            category,
            isActive: true,
        }).$returningId();

        const examId = result.id;

        // 2. Link Questions
        const examQuestionValues = questionIds.map((qId, index) => ({
            examId,
            questionId: qId,
            order: index + 1,
        }));

        if (examQuestionValues.length > 0) {
            await db.insert(examQuestions).values(examQuestionValues);
        }

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Exam created successfully" };
    } catch (error) {
        console.error("Failed to create exam:", error);
        return { message: "Database Error: Failed to Create Exam." };
    }
}

export async function getExamById(id: number) {
    try {
        const exam = await db.query.exams.findFirst({
            where: eq(exams.id, id),
        });

        if (!exam) return null;

        // Fetch Questions
        const questionsData = await db
            .select({
                id: questions.id,
                content: questions.content,
                // Add other question columns if needed
            })
            .from(examQuestions)
            .leftJoin(questions, eq(examQuestions.questionId, questions.id))
            .where(eq(examQuestions.examId, id))
            .orderBy(examQuestions.order);

        return { ...exam, questions: questionsData };
    } catch (error) {
        console.error("Failed to fetch exam:", error);
        return null;
    }
}

export async function updateFixedExam(id: number, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string);
    const category = formData.get("category") as string;
    const questionIdsRaw = formData.get("questionIds") as string;
    const isActive = formData.get("isActive") === "on";


    if (!title || duration === undefined || isNaN(duration) || !questionIdsRaw) {
        console.error("Update Exam Missing Fields:", { title, duration, questionIdsRaw });
        return { message: `Missing fields: Title=${!!title}, Duration=${!isNaN(duration)}, Qs=${!!questionIdsRaw}` };
    }

    const questionIds = questionIdsRaw.split(",").map(id => parseInt(id.trim()));

    try {
        // Validate Question Status
        const selectedQuestions = await db.select({ id: questions.id, status: questions.status })
            .from(questions)
            .where(inArray(questions.id, questionIds));

        const invalidQuestions = selectedQuestions.filter(q => q.status !== "PUBLISHED");

        if (invalidQuestions.length > 0) {
            return { message: `Cannot update exam. ${invalidQuestions.length} selected questions are not PUBLISHED (e.g. pending approval).` };
        }

        await db.update(exams).set({
            title,
            description,
            duration,
            category,
            isActive,
        }).where(eq(exams.id, id));

        // Re-link questions (Delete all, then insert new)
        await db.delete(examQuestions).where(eq(examQuestions.examId, id));

        const examQuestionValues = questionIds.map((qId, index) => ({
            examId: id,
            questionId: qId,
            order: index + 1,
        }));

        if (examQuestionValues.length > 0) {
            await db.insert(examQuestions).values(examQuestionValues);
        }

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Exam updated successfully" };
    } catch (error) {
        console.error("Failed to update exam:", error);
        return { message: "Failed to update exam" };
    }
}

export async function deleteExam(id: number) {
    try {
        await db.delete(examQuestions).where(eq(examQuestions.examId, id));
        await db.delete(examSessions).where(eq(examSessions.examId, id)); // Cascade delete sessions?
        // Note: deleting sessions might leave orphan answers if not careful with foreign keys.
        // Assuming cascade or acceptable data loss for deleted exams.

        await db.delete(exams).where(eq(exams.id, id));

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Exam deleted" };
    } catch (error) {
        console.error("Failed to delete exam:", error);
        return { success: false, message: "Failed to delete exam" };
    }
}

// --- Exam Taking (Peserta) ---

import { fisherYatesShuffle } from "@/lib/utils";

export async function startExamSession(examId: number) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { message: "Unauthorized" };

    try {
        // Check if session already exists
        const existingSession = await db.query.examSessions.findFirst({
            where: and(
                eq(examSessions.userId, userId),
                eq(examSessions.examId, examId),
                eq(examSessions.status, "IN_PROGRESS")
            )
        });

        if (existingSession) {
            console.log("=== Resuming Existing Session ===");
            console.log("Session ID:", existingSession.id);
            console.log("Original Start Time:", existingSession.startTime);
            console.log("=================================");
            return { success: true, sessionId: existingSession.id };
        }

        // Get Exam Details
        const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
        if (!exam) {
            console.error("Exam not found for ID:", examId);
            return { message: "Exam not found" };
        }

        console.log("Found exam:", { id: exam.id, title: exam.title, type: exam.type });

        // Fetch Exam Questions to shuffle
        const examQs = await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));
        const questionIds = examQs.map(q => q.questionId);

        console.log("Exam questions found:", questionIds.length);
        console.log("Question IDs:", questionIds);

        if (questionIds.length === 0) {
            console.error("No questions assigned to exam ID:", examId);
            return { message: "This exam has no questions assigned. Please contact the instructor." };
        }

        // Shuffle Question IDs
        const shuffledIds = fisherYatesShuffle(questionIds);

        console.log("Shuffled question IDs:", shuffledIds);

        // Create new session with shuffled order
        const [result] = await db.insert(examSessions).values({
            userId,
            examId,
            status: "IN_PROGRESS",
            totalQuestions: questionIds.length,
            questionOrder: shuffledIds, // Store randomized IDs
            startTime: new Date(), // Explicitly set start time
        }).$returningId();

        console.log("=== New Exam Session Created ===");
        console.log("Session ID:", result.id);
        console.log("Start Time:", new Date().toISOString());
        console.log("Exam Duration:", exam.duration, "minutes");
        console.log("Total Questions:", questionIds.length);
        console.log("================================");

        return { success: true, sessionId: result.id };
    } catch (error) {
        console.error("Failed to start session:", error);
        return { message: "Failed to start exam" };
    }
}

// Helper function to reset a corrupted exam session
export async function resetExamSession(examId: number) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { message: "Unauthorized" };

    try {
        // Delete any in-progress sessions for this exam
        await db.delete(examSessions).where(
            and(
                eq(examSessions.userId, userId),
                eq(examSessions.examId, examId),
                eq(examSessions.status, "IN_PROGRESS")
            )
        );

        console.log("=== Exam Session Reset ===");
        console.log("User ID:", userId);
        console.log("Exam ID:", examId);
        console.log("==========================");

        return { success: true, message: "Session reset successfully" };
    } catch (error) {
        console.error("Failed to reset session:", error);
        return { message: "Failed to reset session" };
    }
}

export async function getExamSession(sessionId: number) {
    try {
        console.log("=== Getting Exam Session ===");
        console.log("Session ID:", sessionId);

        const session = await db.query.examSessions.findFirst({
            where: eq(examSessions.id, sessionId),
        });

        if (!session) {
            console.error("Session not found for ID:", sessionId);
            return null;
        }

        console.log("Session found:", { id: session.id, examId: session.examId, status: session.status });

        // Fetch Exam
        const [exam] = await db.select().from(exams).where(eq(exams.id, session.examId));

        if (!exam) {
            console.error("Exam not found for ID:", session.examId);
            return null;
        }

        console.log("Exam found:", { id: exam.id, title: exam.title, duration: exam.duration });

        // Calculate time remaining (server-side for accuracy)
        if (!session.startTime) {
            console.error("Session has no start time!");
            return null;
        }

        const startTime = new Date(session.startTime).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const durationSeconds = exam.duration * 60;
        const timeRemaining = Math.max(0, durationSeconds - elapsedSeconds);

        console.log("=== Server Time Calculation ===");
        console.log("Session Start Time:", session.startTime);
        console.log("Current Server Time:", new Date(now).toISOString());
        console.log("Exam Duration (minutes):", exam.duration);
        console.log("Exam Duration (seconds):", durationSeconds);
        console.log("Elapsed Time (seconds):", elapsedSeconds);
        console.log("Time Remaining (seconds):", timeRemaining);
        console.log("Time Remaining (minutes):", Math.floor(timeRemaining / 60));
        console.log("===============================");

        // Get Questions based on stored order OR default
        let qIds: number[] = [];

        if (session.questionOrder && Array.isArray(session.questionOrder) && session.questionOrder.length > 0) {
            qIds = session.questionOrder as number[];
            console.log("Using stored question order:", qIds);
        } else {
            // Fallback for old sessions or errors: fetch from exam_questions
            console.log("No stored order, fetching from exam_questions table...");
            const examqs = await db.select().from(examQuestions)
                .where(eq(examQuestions.examId, session.examId))
                .orderBy(examQuestions.order);
            qIds = examqs.map(eq => eq.questionId);
            console.log("Fetched question IDs from exam_questions:", qIds);
        }

        console.log("Total question IDs to load:", qIds.length);

        let questionsData: any[] = [];
        if (qIds.length > 0) {
            questionsData = await db.select().from(questions)
                .where(inArray(questions.id, qIds));

            console.log("Questions loaded from DB:", questionsData.length);

            // Get Options for these questions
            const optionsData = await db.select().from(options)
                .where(inArray(options.questionId, qIds));

            console.log("Options loaded from DB:", optionsData.length);

            // Map options to questions
            questionsData = questionsData.map(q => ({
                ...q,
                options: optionsData.filter(o => o.questionId === q.id)
            }));

            console.log("Questions with options mapped:", questionsData.map(q => ({ id: q.id, optionCount: q.options.length })));

            // Sort by the randomized order (qIds)
            questionsData.sort((a, b) => {
                const indexA = qIds.indexOf(a.id);
                const indexB = qIds.indexOf(b.id);
                return indexA - indexB;
            });
        } else {
            console.error("No question IDs found for session!");
        }

        console.log("Final questions data count:", questionsData.length);

        return {
            session,
            exam,
            questions: questionsData,
            timeRemaining // Add server-calculated time remaining
        };

    } catch (error) {
        console.error("Error fetching session:", error);
        return null;
    }
}


export async function submitExamAnswer(sessionId: number, questionId: number, answer: string) {
    try {
        // Validation: Check if session is active
        const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId));

        if (!session) return { success: false, message: "Session not found" };
        if (session.status !== "IN_PROGRESS") return { success: false, message: "Exam session is closed" };

        // Check if time has expired
        const [exam] = await db.select().from(exams).where(eq(exams.id, session.examId));
        if (!session.startTime) return { success: false, message: "Invalid session start time" };
        const startTime = new Date(session.startTime).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const durationSeconds = exam.duration * 60;

        if (elapsedSeconds > durationSeconds) {
            // Auto-finish the exam if time expired
            await finishExam(sessionId);
            return { success: false, message: "Time expired. Exam has been auto-submitted." };
        }

        // Fetch question type and options to grade
        const [question] = await db.select().from(questions).where(eq(questions.id, questionId));
        let isCorrect = false;

        if (question.type === "MULTIPLE_CHOICE") {
            const [selectedOption] = await db.select().from(options).where(and(eq(options.id, parseInt(answer)), eq(options.questionId, questionId)));
            if (selectedOption && selectedOption.isCorrect) isCorrect = true;
        }

        // Upsert Answer
        const existing = await db.select().from(examAnswers).where(and(eq(examAnswers.sessionId, sessionId), eq(examAnswers.questionId, questionId)));

        if (existing.length > 0) {
            await db.update(examAnswers)
                .set({ answer, isCorrect })
                .where(eq(examAnswers.id, existing[0].id));
        } else {
            await db.insert(examAnswers).values({
                sessionId,
                questionId,
                answer,
                isCorrect
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to save answer:", error);
        return { success: false };
    }
}


export async function finishExam(sessionId: number) {
    try {
        const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId));

        if (!session) return { success: false, message: "Session not found" };
        if (session.status === "COMPLETED") {
            return { success: true, score: session.score };
        }

        // 1. Fetch all questions and user answers
        const examQs = await db.select().from(examQuestions).where(eq(examQuestions.examId, session.examId));
        const qIds = examQs.map(q => q.questionId);

        const questionsData = await db.select().from(questions).where(inArray(questions.id, qIds));
        const optionsData = await db.select().from(options).where(inArray(options.questionId, qIds));
        const userAnswers = await db.select().from(examAnswers).where(eq(examAnswers.sessionId, sessionId));

        // 2. Initialize Category Accumulators
        let stats = {
            PG: { earned: 0, max: 0 },
            SA: { earned: 0, max: 0 },
            ESSAY: { earned: 0, max: 0 }
        };

        let correctCount = 0;

        // 3. Scoring Loop
        for (const question of questionsData) {
            const answerRecord = userAnswers.find(a => a.questionId === question.id);
            const weight = question.weight || 1;

            // Stats Max Accumulation
            if (question.type === "MULTIPLE_CHOICE") stats.PG.max += weight;
            else if (question.type === "SHORT_ANSWER") stats.SA.max += weight;
            else if (question.type === "ESSAY") stats.ESSAY.max += weight;

            // Use shared scoring logic
            const result = calculateQuestionScore(
                question,
                answerRecord?.answer || "",
                optionsData.filter(o => o.questionId === question.id)
            );

            const { earned, isCorrect, feedback } = result;
            if (isCorrect) correctCount++;

            // Update Exam Answer record with calculated score
            if (answerRecord) {
                await db.update(examAnswers)
                    .set({ score: earned, isCorrect, feedback })
                    .where(eq(examAnswers.id, answerRecord.id));
            }

            // Accumulate category totals
            if (question.type === "MULTIPLE_CHOICE") stats.PG.earned += earned;
            else if (question.type === "SHORT_ANSWER") stats.SA.earned += earned;
            else if (question.type === "ESSAY") stats.ESSAY.earned += earned;
        }

        // 4. Calculate Final Weighted Score
        // Formula: (PG_Earned / PG_Max * 30) + (SA_Earned / SA_Max * 30) + (Essay_Earned / Essay_Max * 40)

        const scorePG = stats.PG.max > 0 ? (Math.max(0, stats.PG.earned) / stats.PG.max) * 30 : 0;
        const scoreSA = stats.SA.max > 0 ? (stats.SA.earned / stats.SA.max) * 30 : 0;
        const scoreEssay = stats.ESSAY.max > 0 ? (stats.ESSAY.earned / stats.ESSAY.max) * 40 : 0;

        const finalScore = Math.round(scorePG + scoreSA + scoreEssay); // 0 - 100

        console.log("=== Scoring Debug ===");
        console.log("PG:", stats.PG, "->", scorePG);
        console.log("SA:", stats.SA, "->", scoreSA);
        console.log("Essay:", stats.ESSAY, "->", scoreEssay);
        console.log("Final:", finalScore);

        await db.update(examSessions).set({
            status: "COMPLETED",
            endTime: new Date(),
            score: finalScore,
            correctAnswers: correctCount,
            totalQuestions: qIds.length
        }).where(eq(examSessions.id, sessionId));

        revalidatePath("/dashboard/latihan-ujian");
        revalidatePath("/dashboard");

        return { success: true, score: finalScore };
    } catch (error) {
        console.error("Failed to finish exam:", error);
        return { success: false };
    }
}

export async function getExamHistory(page = 1, limit = 5) {
    const session = await auth();
    const userId = session?.user?.id;

    console.log("=== Getting Exam History ===");
    console.log("User ID:", userId);
    console.log("Page:", page, "Limit:", limit);

    if (!userId) {
        console.log("No user ID, returning empty array");
        return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    try {
        // Get total count
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(eq(examSessions.userId, userId));

        const total = Number(countResult?.count || 0);
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Get paginated data
        const history = await db.select({
            id: examSessions.id,
            date: examSessions.endTime,
            score: examSessions.score,
            status: examSessions.status,
            examTitle: exams.title,
            feedback: examSessions.feedback, // Added feedback field
        })
            .from(examSessions)
            .leftJoin(exams, eq(examSessions.examId, exams.id))
            .where(eq(examSessions.userId, userId))
            .orderBy(desc(examSessions.startTime))
            .limit(limit)
            .offset(offset);

        console.log("Exam history found:", history.length, "records");
        console.log("Total records:", total, "Total pages:", totalPages);
        console.log("============================");

        return {
            data: history,
            total,
            page,
            limit,
            totalPages
        };
    } catch (error) {
        console.error("Failed to fetch exam history:", error);
        return { data: [], total: 0, page, limit, totalPages: 0 };
    }
}

export async function getExamResult(sessionId: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, message: "Unauthorized" };

    try {
        const examSession = await db.query.examSessions.findFirst({
            where: and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)),
        });

        if (!examSession) return { success: false, message: "Session not found" };
        if (examSession.status !== "COMPLETED") return { success: false, message: "Exam not completed yet" };

        const [exam] = await db.select().from(exams).where(eq(exams.id, examSession.examId));

        // Get Questions
        let qIds: number[] = [];
        if (examSession.questionOrder && Array.isArray(examSession.questionOrder)) {
            qIds = examSession.questionOrder as number[];
        } else {
            const examqs = await db.select().from(examQuestions)
                .where(eq(examQuestions.examId, examSession.examId))
                .orderBy(examQuestions.order);
            qIds = examqs.map(eq => eq.questionId);
        }

        const questionsData = await db.select().from(questions).where(inArray(questions.id, qIds));
        const optionsData = await db.select().from(options).where(inArray(options.questionId, qIds));
        const answersData = await db.select().from(examAnswers).where(eq(examAnswers.sessionId, sessionId));

        // Map data
        const detailedResults = qIds.map(qId => {
            const question = questionsData.find(q => q.id === qId);
            const userAns = answersData.find(a => a.questionId === qId);
            const questionOptions = optionsData.filter(o => o.questionId === qId);
            const correctOption = questionOptions.find(o => o.isCorrect);

            if (!question) return null;

            return {
                ...question,
                options: questionOptions,
                userAnswer: userAns?.answer,
                isCorrect: userAns?.isCorrect,
                earnedScore: userAns?.score || 0,
                feedback: userAns?.feedback,
                // Pass through scoring metadata for UI display
                weight: question.weight,
                answerKeys: question.answerKeys,
                rubric: question.rubric,
                correctAnswerRaw: correctOption?.id,
                correctAnswerText: correctOption?.content || "Check Explanation",
            };
        }).filter(Boolean);

        return {
            success: true,
            session: examSession,
            exam,
            results: detailedResults
        };

    } catch (error) {
        console.error("Failed to fetch exam result:", error);
        return { success: false, message: "Failed to load results" };
    }
}

export async function simulateQuestionScore(
    questionData: any,
    answer: string
) {
    try {
        const session = await auth();
        // Allow if user is admin/pembina OR if it's a dry run from question form
        // Ideally checking role here
        if (!session?.user) return { success: false, message: "Unauthorized" };

        let optionsData: any[] = [];
        // If question has ID (existing), fetch options. 
        // If it's a new question being drafted, options might need to be passed in. 
        // For now, let's assume this is used for EXISTING questions or passed fully.
        // Actually, for "Preview Scoring" in QuestionForm, the question data comes from the form state, not DB.
        // So we should rely on `questionData` having everything.

        // But `calculateQuestionScore` expects `options` array separately for MC.
        // Let's check if questionData has options.
        if (questionData.options && Array.isArray(questionData.options)) {
            optionsData = questionData.options;
        }

        const result = calculateQuestionScore(questionData, answer, optionsData);
        return { success: true, result };

    } catch (error) {
        console.error("Simulation error:", error);
        return { success: false, message: "Simulation failed" };
    }
}
