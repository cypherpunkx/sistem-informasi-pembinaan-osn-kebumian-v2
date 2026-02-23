"use server";

import { db } from "@/lib/db";
import { exams, examQuestions, examSessions, examAnswers, questions, options, users } from "@/lib/schema";
import { eq, and, desc, inArray, sql, like, gte, lte, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { calculateQuestionScore, type ScoringQuestion } from "@/lib/scoring";

// --- Exam Management (Admin/Pembina) ---

/** Parse optional datetime from form (datetime-local value or empty). */
function parseOptionalDatetime(value: FormDataEntryValue | null): Date | null {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

/** Hitung soal PUBLISHED yang memenuhi filter (topik, difficulty). Untuk validasi create/update ujian dinamis. */
async function countQuestionsMatchingFilter(params: {
    topics?: string[];
    difficulties?: ("EASY" | "MEDIUM" | "HARD")[];
}): Promise<number> {
    const conditions = [eq(questions.status, "PUBLISHED")];
    if (params.topics?.length) conditions.push(inArray(questions.topic, params.topics));
    if (params.difficulties?.length) conditions.push(inArray(questions.difficulty, params.difficulties));
    const rows = await db.select({ id: questions.id }).from(questions).where(and(...conditions));
    return rows.length;
}

/** Returns { role, userId } if current user is admin or pembina; otherwise returns { message: string }. */
async function requireAdminOrPembina(): Promise<{ message: string } | { role: "admin" | "pembina"; userId: number }> {
    const session = await auth();
    if (!session?.user?.id) return { message: "Unauthorized" };
    const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (user?.role !== "admin" && user?.role !== "pembina") return { message: "Forbidden: hanya admin atau pembina." };
    return { role: user!.role as "admin" | "pembina", userId: user!.id };
}

/** Returns null if current user is admin; otherwise returns { message: string }. */
async function requireAdminOnly(): Promise<{ message: string } | null> {
    const session = await auth();
    if (!session?.user?.id) return { message: "Unauthorized" };
    const user = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (user?.role !== "admin") return { message: "Forbidden: hanya admin." };
    return null;
}

export async function getExams() {
    try {
        const data = await db.select().from(exams).orderBy(desc(exams.createdAt));
        return data;
    } catch (error) {
        console.error("Failed to fetch exams:", error);
        return [];
    }
}

export interface ExamFilters {
    search?: string;
    type?: string;
    category?: string;
    status?: string; // "active" | "inactive" | "all"
    page?: number;
    limit?: number;
    /** Untuk list peserta: tampilkan semua ujian aktif (termasuk belum/telah tutup), tanpa filter jadwal. */
    forPesertaList?: boolean;
}

export interface GetExamsFilteredResult {
    data: Awaited<ReturnType<typeof getExams>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getExamsFiltered(filters: ExamFilters = {}): Promise<GetExamsFilteredResult> {
    try {
        const { search, type, category, status = "all", page = 1, limit = 12 } = filters;
        const conditions = [];

        if (search?.trim()) {
            conditions.push(like(exams.title, `%${search.trim()}%`));
        }
        if (type && type !== "All") {
            conditions.push(eq(exams.type, type as "FIXED" | "DYNAMIC"));
        }
        if (category?.trim()) {
            conditions.push(eq(exams.category, category.trim()));
        }
        if (status === "active") {
            conditions.push(eq(exams.isActive, true));
            // Untuk list peserta tampilkan semua ujian aktif; untuk filter lain hanya yang dalam jadwal
            if (!filters.forPesertaList) {
                const now = new Date();
                conditions.push(
                    or(
                        and(isNull(exams.availableStart), isNull(exams.availableEnd)),
                        and(
                            or(isNull(exams.availableStart), lte(exams.availableStart, now)),
                            or(isNull(exams.availableEnd), gte(exams.availableEnd, now))
                        )
                    )
                );
            }
        } else if (status === "inactive") {
            conditions.push(eq(exams.isActive, false));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [countRow] = await db
            .select({ count: sql<number>`count(*)` })
            .from(exams)
            .where(whereClause);
        const total = Number(countRow?.count ?? 0);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const offset = (Math.max(1, page) - 1) * limit;

        const data = await db
            .select()
            .from(exams)
            .where(whereClause)
            .orderBy(desc(exams.createdAt))
            .limit(limit)
            .offset(offset);

        return { data, total, page: Math.max(1, page), limit, totalPages };
    } catch (error) {
        console.error("Failed to fetch exams (filtered):", error);
        return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }
}

export interface ExamCounts {
    examId: number;
    questionCount: number;
    participantCount: number;
}

/** Jumlah soal dan jumlah peserta (sesi selesai) per ujian. Untuk tampilan card manajemen ujian. DYNAMIC pakai filterConfig.questionCount. */
export async function getExamCountsForIds(examIds: number[]): Promise<ExamCounts[]> {
    if (examIds.length === 0) return [];
    try {
        const examRows = await db.select({ id: exams.id, type: exams.type, filterConfig: exams.filterConfig }).from(exams).where(inArray(exams.id, examIds));
        const questionCounts = await db
            .select({ examId: examQuestions.examId, count: sql<number>`count(*)` })
            .from(examQuestions)
            .where(inArray(examQuestions.examId, examIds))
            .groupBy(examQuestions.examId);
        const participantCounts = await db
            .select({ examId: examSessions.examId, count: sql<number>`count(*)` })
            .from(examSessions)
            .where(and(inArray(examSessions.examId, examIds), eq(examSessions.status, "COMPLETED")))
            .groupBy(examSessions.examId);
        const qMap = new Map(questionCounts.map((r) => [r.examId, Number(r.count)]));
        const pMap = new Map(participantCounts.map((r) => [r.examId, Number(r.count)]));
        const dynamicCount = new Map(examRows.filter(e => e.type === "DYNAMIC").map(e => {
            const config = e.filterConfig as { questionCount?: number } | null;
            return [e.id, config?.questionCount ?? 0] as [number, number];
        }));
        return examIds.map((id) => ({
            examId: id,
            questionCount: dynamicCount.has(id) ? dynamicCount.get(id)! : (qMap.get(id) ?? 0),
            participantCount: pMap.get(id) ?? 0,
        }));
    } catch (error) {
        console.error("Failed to fetch exam counts:", error);
        return examIds.map((id) => ({ examId: id, questionCount: 0, participantCount: 0 }));
    }
}

/** Daftar ujian aktif untuk peserta (Latihan & Ujian) dengan pagination. Hanya role peserta. Mengembalikan semua ujian aktif (termasuk akan mulai / sudah berakhir) agar bisa tampil status dinamis. */
export async function getExamsForPeserta(filters: Omit<ExamFilters, "status"> & { page?: number; limit?: number } = {}): Promise<GetExamsFilteredResult> {
    const session = await auth();
    if (session?.user?.role !== "peserta") {
        return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }
    return getExamsFiltered({ ...filters, status: "active", forPesertaList: true });
}

export async function getDistinctExamCategories(): Promise<string[]> {
    try {
        const rows = await db
            .selectDistinct({ category: exams.category })
            .from(exams)
            .where(sql`${exams.category} IS NOT NULL AND ${exams.category} != ''`);
        const list = rows.map((r) => r.category).filter((c): c is string => !!c);
        list.sort((a, b) => a.localeCompare(b));
        return list;
    } catch (error) {
        console.error("Failed to fetch exam categories:", error);
        return [];
    }
}

/** Topik unik dari soal PUBLISHED (untuk form ujian dinamis). */
export async function getDistinctQuestionTopics(): Promise<string[]> {
    try {
        const rows = await db
            .selectDistinct({ topic: questions.topic })
            .from(questions)
            .where(eq(questions.status, "PUBLISHED"));
        const list = rows.map((r) => r.topic).filter((t): t is string => !!t);
        list.sort((a, b) => a.localeCompare(b));
        return list;
    } catch (error) {
        console.error("Failed to fetch question topics:", error);
        return [];
    }
}

export type ReportFilters = {
    periodDays?: number;
    category?: string;
    type?: "FIXED" | "DYNAMIC" | "all";
};

export type ReportSummary = {
    totalExams: number;
    totalParticipants: number;
    avgScore: number | null;
    completionRate: number | null;
};

export type ReportTrendPoint = { label: string; count: number };
export type ReportDistributionBucket = { bucket: string; count: number };
export type ReportExamRow = {
    examId: number;
    title: string;
    participantCount: number;
    completedCount: number;
    avgScore: number | null;
    maxScore: number | null;
    completionRate: number;
};

/** Data laporan: summary, tren peserta, distribusi nilai, performa per ujian. */
export async function getReportData(filters: ReportFilters = {}) {
    const { periodDays = 30, category, type = "all" } = filters;
    const safePeriodDays = Math.max(1, Math.min(365, periodDays));
    try {
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - safePeriodDays);
        const periodStartStr = periodStart.toISOString().slice(0, 19).replace("T", " ");

        const allSessionsInPeriod = await db
            .select({
                examId: examSessions.examId,
                userId: examSessions.userId,
                startTime: examSessions.startTime,
                status: examSessions.status,
                score: examSessions.score,
            })
            .from(examSessions)
            .where(sql`${examSessions.startTime} >= ${periodStartStr}`);

        let examIds = [...new Set(allSessionsInPeriod.map((s) => s.examId))];
        if ((category && category !== "all") || (type && type !== "all")) {
            const conditions = [inArray(exams.id, examIds)];
            if (category && category !== "all") conditions.push(eq(exams.category, category));
            if (type && type !== "all") conditions.push(eq(exams.type, type));
            const filtered = await db
                .select({ id: exams.id })
                .from(exams)
                .where(and(...conditions));
            examIds = filtered.map((r) => r.id);
        }
        const sessionsInPeriod = allSessionsInPeriod.filter((s) => examIds.includes(s.examId));

        const examList =
            examIds.length === 0
                ? []
                : await db
                    .select({ id: exams.id, title: exams.title })
                    .from(exams)
                    .where(inArray(exams.id, examIds));
        if (examIds.length === 0) {
            return {
                summary: {
                    totalExams: 0,
                    totalParticipants: 0,
                    avgScore: null,
                    completionRate: null,
                },
                trend: [] as ReportTrendPoint[],
                distribution: [
                    { bucket: "0–40", count: 0 },
                    { bucket: "41–60", count: 0 },
                    { bucket: "61–80", count: 0 },
                    { bucket: "81–100", count: 0 },
                ],
                examRows: [] as ReportExamRow[],
            };
        }

        const uniqueParticipantIds = new Set(sessionsInPeriod.map((s) => s.userId));
        const totalParticipants = uniqueParticipantIds.size;
        const completedSessions = sessionsInPeriod.filter((s) => s.status === "COMPLETED");
        const uniqueCompletedParticipantIds = new Set(completedSessions.map((s) => s.userId));
        const completionRate =
            totalParticipants > 0
                ? Math.round((uniqueCompletedParticipantIds.size / totalParticipants) * 100)
                : null;
        const scores = completedSessions
            .map((s) => s.score)
            .filter((s): s is number => s != null);
        const avgScore =
            scores.length > 0
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                : null;

        const summary: ReportSummary = {
            totalExams: examList.length,
            totalParticipants,
            avgScore,
            completionRate: completionRate ?? null,
        };

        const byDay = new Map<string, number>();
        for (let d = 0; d < safePeriodDays; d++) {
            const day = new Date(periodStart);
            day.setDate(day.getDate() + d);
            const key = day.toISOString().slice(0, 10);
            byDay.set(key, 0);
        }
        sessionsInPeriod.forEach((s) => {
            const t = s.startTime;
            if (t == null) return;
            const key = (t instanceof Date ? t : new Date(t as string)).toISOString().slice(0, 10);
            if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
        });
        const trend: ReportTrendPoint[] = Array.from(byDay.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([label, count]) => ({ label, count }));

        const distBuckets = [
            { key: "0–40", min: 0, max: 40 },
            { key: "41–60", min: 41, max: 60 },
            { key: "61–80", min: 61, max: 80 },
            { key: "81–100", min: 81, max: 100 },
        ];
        const distCounts = distBuckets.map((b) => ({
            bucket: b.key,
            count: scores.filter((s) => s >= b.min && s <= b.max).length,
        }));
        const distribution = distCounts;

        const examStats = new Map<
            number,
            { started: number; completed: number; scores: number[] }
        >();
        examList.forEach((e) => examStats.set(e.id, { started: 0, completed: 0, scores: [] }));
        sessionsInPeriod.forEach((s) => {
            const stat = examStats.get(s.examId);
            if (!stat) return;
            stat.started += 1;
            if (s.status === "COMPLETED") {
                stat.completed += 1;
                if (s.score != null) stat.scores.push(s.score);
            }
        });
        const examRows: ReportExamRow[] = examList.map((e) => {
            const stat = examStats.get(e.id) ?? {
                started: 0,
                completed: 0,
                scores: [] as number[],
            };
            const avg =
                stat.scores.length > 0
                    ? Math.round(
                        (stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length) * 10
                    ) / 10
                    : null;
            const max = stat.scores.length > 0 ? Math.max(...stat.scores) : null;
            const completionRateExam =
                stat.started > 0 ? Math.round((stat.completed / stat.started) * 100) : 0;
            return {
                examId: e.id,
                title: e.title,
                participantCount: stat.started,
                completedCount: stat.completed,
                avgScore: avg,
                maxScore: max,
                completionRate: completionRateExam,
            };
        });

        return { summary, trend, distribution, examRows };
    } catch (error) {
        console.error("Failed to fetch report data:", error);
        return {
            summary: {
                totalExams: 0,
                totalParticipants: 0,
                avgScore: null,
                completionRate: null,
            },
            trend: [],
            distribution: [
                { bucket: "0–40", count: 0 },
                { bucket: "41–60", count: 0 },
                { bucket: "61–80", count: 0 },
                { bucket: "81–100", count: 0 },
            ],
            examRows: [],
        };
    }
}

export async function createFixedExam(_prevState: unknown, formData: FormData): Promise<{ success?: boolean; message?: string }> {
    const authResult = await requireAdminOrPembina();
    if ("message" in authResult) return { message: authResult.message };
    const isActive = authResult.role === "admin"; // Pembina butuh approval admin (aktifkan manual)

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string);
    const category = formData.get("category") as string;
    const questionIdsRaw = formData.get("questionIds") as string; // Comma separated IDs

    if (!title || !duration || !questionIdsRaw) {
        return { message: "Missing required fields" };
    }

    const questionIds = questionIdsRaw.split(",").map(id => parseInt(id.trim(), 10));
    const validQuestionIds = questionIds.filter((id): id is number => Number.isInteger(id) && id > 0);
    if (validQuestionIds.length === 0) {
        return { message: "No valid question IDs" };
    }

    try {
        // Validate Question Status
        const selectedQuestions = await db.select({ id: questions.id, status: questions.status })
            .from(questions)
            .where(inArray(questions.id, validQuestionIds));

        const invalidQuestions = selectedQuestions.filter(q => q.status !== "PUBLISHED");

        if (invalidQuestions.length > 0) {
            return { message: `Cannot create exam. ${invalidQuestions.length} selected questions are not PUBLISHED (e.g. pending approval).` };
        }

        const availableStart = parseOptionalDatetime(formData.get("availableStart"));
        const availableEnd = parseOptionalDatetime(formData.get("availableEnd"));
        if (availableStart && availableEnd && availableStart >= availableEnd) {
            return { message: "Waktu buka harus sebelum waktu tutup." };
        }

        // 1. Create Exam
        const [result] = await db.insert(exams).values({
            title,
            description,
            duration,
            type: "FIXED",
            category,
            isActive,
            availableStart: availableStart ?? null,
            availableEnd: availableEnd ?? null,
            createdBy: authResult.userId,
        }).$returningId();

        const examId = result.id;

        // 2. Link Questions
        const examQuestionValues = validQuestionIds.map((qId, index) => ({
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

/** Buat ujian dinamis: soal diambil random dari bank sesuai filter (topik, level, jumlah) saat peserta mulai. */
export async function createDynamicExam(_prevState: unknown, formData: FormData): Promise<{ success?: boolean; message?: string }> {
    const authResult = await requireAdminOrPembina();
    if ("message" in authResult) return { message: authResult.message };
    const isActive = authResult.role === "admin";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string);
    const category = formData.get("category") as string;
    const questionCount = parseInt(formData.get("questionCount") as string);
    const topicsRaw = formData.get("topics") as string; // comma-separated
    const difficultiesRaw = formData.get("difficulties") as string; // comma: EASY,MEDIUM,HARD

    if (!title?.trim() || !duration || duration < 1) {
        return { message: "Judul dan durasi wajib." };
    }
    if (!questionCount || questionCount < 1) {
        return { message: "Jumlah soal minimal 1." };
    }

    const topics = topicsRaw?.split(",").map(t => t.trim()).filter(Boolean) ?? [];
    const difficulties = (difficultiesRaw?.split(",").map(d => d.trim()) ?? []).filter(
        (d): d is "EASY" | "MEDIUM" | "HARD" => ["EASY", "MEDIUM", "HARD"].includes(d)
    );

    const availableStart = parseOptionalDatetime(formData.get("availableStart"));
    const availableEnd = parseOptionalDatetime(formData.get("availableEnd"));
    if (availableStart && availableEnd && availableStart >= availableEnd) {
        return { message: "Waktu buka harus sebelum waktu tutup." };
    }

    const available = await countQuestionsMatchingFilter({ topics, difficulties: difficulties.length ? difficulties : undefined });
    if (available < questionCount) {
        return {
            message: `Soal di bank yang memenuhi filter tidak cukup. Dibutuhkan ${questionCount}, tersedia ${available}. Perbanyak soal atau ubah filter/jumlah soal.`,
        };
    }

    try {
        await db.insert(exams).values({
            title: title.trim(),
            description: description?.trim() || null,
            duration,
            type: "DYNAMIC",
            category: category?.trim() || null,
            isActive,
            availableStart: availableStart ?? null,
            availableEnd: availableEnd ?? null,
            filterConfig: { topics: topics.length ? topics : undefined, difficulties: difficulties.length ? difficulties : undefined, questionCount },
            createdBy: authResult.userId,
        });

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Ujian dinamis dibuat. Soal akan diambil acak saat peserta mulai." };
    } catch (error) {
        console.error("Failed to create dynamic exam:", error);
        return { message: "Gagal membuat ujian dinamis." };
    }
}

export async function getExamById(id: number) {
    try {
        const exam = await db.query.exams.findFirst({
            where: eq(exams.id, id),
        });

        if (!exam) return null;

        if (exam.type === "DYNAMIC") {
            return { ...exam, questions: [] };
        }

        const questionsData = await db
            .select({
                id: questions.id,
                content: questions.content,
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

export type ExamDetailParticipant = {
    name: string;
    score: number | null;
    status: string;
    durationMinutes: number | null;
};

export type ExamDetailStats = {
    avgScore: number | null;
    minScore: number | null;
    maxScore: number | null;
    completedCount: number;
};

/** Data untuk halaman detail ujian (admin): exam, counts, stats, participants. */
export async function getExamDetailData(examId: number) {
    try {
        const exam = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
        if (!exam) return null;

        const [counts] = await Promise.all([
            getExamCountsForIds([examId]).then((arr) => arr[0] ?? { examId, questionCount: 0, participantCount: 0 }),
        ]);
        const questionCount = counts.questionCount;
        const [{ count: participantCountRaw }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(eq(examSessions.examId, examId));
        const participantCount = Number(participantCountRaw ?? 0);

        const completedSessions = await db
            .select({ score: examSessions.score })
            .from(examSessions)
            .where(and(eq(examSessions.examId, examId), eq(examSessions.status, "COMPLETED")));
        const scores = completedSessions.map((s) => s.score).filter((n): n is number => n != null);
        const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        const minScore = scores.length ? Math.min(...scores) : null;
        const maxScore = scores.length ? Math.max(...scores) : null;
        const stats: ExamDetailStats = {
            avgScore: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
            minScore,
            maxScore,
            completedCount: completedSessions.length,
        };

        const sessionsWithUser = await db
            .select({
                name: users.name,
                score: examSessions.score,
                status: examSessions.status,
                startTime: examSessions.startTime,
                endTime: examSessions.endTime,
            })
            .from(examSessions)
            .leftJoin(users, sql`${users.id} = CAST(${examSessions.userId} AS SIGNED)`)
            .where(eq(examSessions.examId, examId))
            .orderBy(desc(examSessions.endTime));

        const participants: ExamDetailParticipant[] = sessionsWithUser.map((row) => {
            let durationMinutes: number | null = null;
            if (row.endTime && row.startTime) {
                const start = row.startTime instanceof Date ? row.startTime.getTime() : new Date(row.startTime).getTime();
                const end = row.endTime instanceof Date ? row.endTime.getTime() : new Date(row.endTime).getTime();
                durationMinutes = Math.round((end - start) / 60000);
            }
            return {
                name: row.name ?? "—",
                score: row.score ?? null,
                status: row.status === "COMPLETED" ? "Selesai" : "Belum",
                durationMinutes,
            };
        });

        return {
            exam,
            questionCount,
            participantCount,
            stats,
            participants,
            questionsList: await db
                .select({ id: questions.id, content: questions.content })
                .from(examQuestions)
                .leftJoin(questions, eq(examQuestions.questionId, questions.id))
                .where(eq(examQuestions.examId, examId))
                .orderBy(examQuestions.order),
        };
    } catch (error) {
        console.error("Failed to fetch exam detail:", error);
        return null;
    }
}

export async function updateFixedExam(id: number, formData: FormData) {
    const authResult = await requireAdminOrPembina();
    if ("message" in authResult) return { message: authResult.message };

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

    const questionIds = questionIdsRaw.split(",").map(id => parseInt(id.trim(), 10));
    const validQuestionIds = questionIds.filter((id): id is number => Number.isInteger(id) && id > 0);
    if (validQuestionIds.length === 0) {
        return { message: "No valid question IDs" };
    }

    try {
        // Validate Question Status
        const selectedQuestions = await db.select({ id: questions.id, status: questions.status })
            .from(questions)
            .where(inArray(questions.id, validQuestionIds));

        const invalidQuestions = selectedQuestions.filter(q => q.status !== "PUBLISHED");

        if (invalidQuestions.length > 0) {
            return { message: `Cannot update exam. ${invalidQuestions.length} selected questions are not PUBLISHED (e.g. pending approval).` };
        }

        const availableStart = parseOptionalDatetime(formData.get("availableStart"));
        const availableEnd = parseOptionalDatetime(formData.get("availableEnd"));
        if (availableStart && availableEnd && availableStart >= availableEnd) {
            return { message: "Waktu buka harus sebelum waktu tutup." };
        }

        await db.update(exams).set({
            title,
            description,
            duration,
            category,
            isActive,
            availableStart: availableStart ?? null,
            availableEnd: availableEnd ?? null,
        }).where(eq(exams.id, id));

        // Re-link questions (Delete all, then insert new)
        await db.delete(examQuestions).where(eq(examQuestions.examId, id));

        const examQuestionValues = validQuestionIds.map((qId, index) => ({
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

/** Update ujian dinamis (filter config saja, tidak ada soal tetap). */
export async function updateDynamicExam(id: number, formData: FormData) {
    const authResult = await requireAdminOrPembina();
    if ("message" in authResult) return { message: authResult.message };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string);
    const category = formData.get("category") as string;
    const isActive = formData.get("isActive") === "on";
    const questionCount = parseInt(formData.get("questionCount") as string);
    const topicsRaw = formData.get("topics") as string;
    const difficultiesRaw = formData.get("difficulties") as string;

    if (!title?.trim() || duration === undefined || isNaN(duration) || duration < 1) {
        return { message: "Judul dan durasi wajib." };
    }
    if (!questionCount || questionCount < 1) {
        return { message: "Jumlah soal minimal 1." };
    }

    const topics = topicsRaw?.split(",").map(t => t.trim()).filter(Boolean) ?? [];
    const difficulties = (difficultiesRaw?.split(",").map(d => d.trim()) ?? []).filter(
        (d): d is "EASY" | "MEDIUM" | "HARD" => ["EASY", "MEDIUM", "HARD"].includes(d)
    );

    const availableStart = parseOptionalDatetime(formData.get("availableStart"));
    const availableEnd = parseOptionalDatetime(formData.get("availableEnd"));
    if (availableStart && availableEnd && availableStart >= availableEnd) {
        return { message: "Waktu buka harus sebelum waktu tutup." };
    }

    const available = await countQuestionsMatchingFilter({ topics, difficulties: difficulties.length ? difficulties : undefined });
    if (available < questionCount) {
        return {
            message: `Soal di bank yang memenuhi filter tidak cukup. Dibutuhkan ${questionCount}, tersedia ${available}. Perbanyak soal atau ubah filter/jumlah soal.`,
        };
    }

    try {
        const [existing] = await db.select({ type: exams.type }).from(exams).where(eq(exams.id, id));
        if (!existing || existing.type !== "DYNAMIC") {
            return { message: "Ujian bukan tipe dinamis." };
        }

        await db.update(exams).set({
            title: title.trim(),
            description: description?.trim() || null,
            duration,
            category: category?.trim() || null,
            isActive,
            availableStart: availableStart ?? null,
            availableEnd: availableEnd ?? null,
            filterConfig: { topics: topics.length ? topics : undefined, difficulties: difficulties.length ? difficulties : undefined, questionCount },
        }).where(eq(exams.id, id));

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Ujian dinamis diperbarui." };
    } catch (error) {
        console.error("Failed to update dynamic exam:", error);
        return { message: "Gagal memperbarui ujian dinamis." };
    }
}

export async function deleteExam(id: number) {
    const authResult = await requireAdminOrPembina();
    if ("message" in authResult) return { success: false, message: authResult.message };
    try {
        await db.delete(examQuestions).where(eq(examQuestions.examId, id));
        await db.delete(examSessions).where(eq(examSessions.examId, id));

        await db.delete(exams).where(eq(exams.id, id));

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Exam deleted" };
    } catch (error) {
        console.error("Failed to delete exam:", error);
        return { success: false, message: "Failed to delete exam" };
    }
}

/** Set isActive = false (arsip) atau true (aktifkan kembali). Hanya admin (approval pembina). */
export async function toggleExamArchive(id: number) {
    const forbid = await requireAdminOnly();
    if (forbid) return { success: false, message: forbid.message };
    try {
        const [exam] = await db.select({ isActive: exams.isActive }).from(exams).where(eq(exams.id, id));
        if (!exam) return { success: false, message: "Ujian tidak ditemukan" };
        await db.update(exams).set({ isActive: !exam.isActive }).where(eq(exams.id, id));
        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: exam.isActive ? "Ujian diarsipkan" : "Ujian diaktifkan kembali" };
    } catch (error) {
        console.error("Failed to toggle exam archive:", error);
        return { success: false, message: "Gagal mengubah status" };
    }
}

/** Duplikat ujian: buat paket baru dengan judul "Salinan - {title}" dan soal yang sama. */
export async function duplicateExam(id: number) {
    const authResult = await requireAdminOrPembina();
    if ("message" in authResult) return { success: false, message: authResult.message };
    try {
        const [source] = await db.select().from(exams).where(eq(exams.id, id));
        if (!source) return { success: false, message: "Ujian tidak ditemukan" };

        const eqRows = await db.select({ questionId: examQuestions.questionId, order: examQuestions.order }).from(examQuestions).where(eq(examQuestions.examId, id));

        const [newRow] = await db
            .insert(exams)
            .values({
                title: `Salinan - ${source.title}`,
                description: source.description,
                duration: source.duration,
                type: source.type,
                category: source.category,
                isActive: false,
                availableStart: source.availableStart ?? null,
                availableEnd: source.availableEnd ?? null,
                filterConfig: source.filterConfig ?? null,
                createdBy: authResult.userId,
            })
            .$returningId();
        const newId = newRow.id;

        if (source.type === "FIXED" && eqRows.length > 0) {
            await db.insert(examQuestions).values(
                eqRows.map((r) => ({ examId: newId, questionId: r.questionId, order: r.order }))
            );
        }

        revalidatePath("/dashboard/manajemen-ujian");
        return { success: true, message: "Ujian diduplikat", newId };
    } catch (error) {
        console.error("Failed to duplicate exam:", error);
        return { success: false, message: "Gagal menduplikat ujian" };
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
            return { success: true, sessionId: existingSession.id };
        }

        // Get Exam Details
        const [exam] = await db.select().from(exams).where(eq(exams.id, examId)).limit(1);
        if (!exam) {
            console.error("Exam not found for ID:", examId);
            return { message: "Exam not found" };
        }

        const now = new Date();
        if (exam.availableStart && now < exam.availableStart) {
            const openAt = exam.availableStart.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
            return { message: `Ujian belum dibuka. Buka pada ${openAt}.` };
        }
        if (exam.availableEnd && now > exam.availableEnd) {
            const closedAt = exam.availableEnd.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
            return { message: `Ujian sudah ditutup sejak ${closedAt}.` };
        }

        // Satu attempt per user per paket untuk kategori selain Latihan (Try Out, Simulasi, OSN, dll.)
        const categoryTrimmed = typeof exam.category === "string" ? exam.category.trim() : "";
        if (categoryTrimmed !== "Latihan") {
            const alreadyCompleted = await db.query.examSessions.findFirst({
                where: and(
                    eq(examSessions.userId, userId),
                    eq(examSessions.examId, examId),
                    eq(examSessions.status, "COMPLETED")
                ),
            });
            if (alreadyCompleted) {
                return {
                    message: "Anda sudah mengerjakan paket ini. Setiap peserta hanya boleh mengerjakan sekali untuk ujian selain latihan.",
                };
            }
        }

        let questionIds: number[];

        if (exam.type === "DYNAMIC") {
            const config = exam.filterConfig as { topics?: string[]; difficulties?: ("EASY" | "MEDIUM" | "HARD")[]; questionCount: number } | null;
            if (!config?.questionCount || config.questionCount < 1) {
                return { message: "Konfigurasi ujian dinamis tidak valid (jumlah soal)." };
            }
            const conditions = [eq(questions.status, "PUBLISHED")];
            if (config.topics?.length) conditions.push(inArray(questions.topic, config.topics));
            if (config.difficulties?.length) conditions.push(inArray(questions.difficulty, config.difficulties));
            const pool = await db.select({ id: questions.id }).from(questions).where(and(...conditions));
            const poolIds = pool.map(p => p.id);
            if (poolIds.length < config.questionCount) {
                return { message: `Soal yang memenuhi filter tidak cukup. Dibutuhkan ${config.questionCount}, tersedia ${poolIds.length}. Ubah filter atau jumlah soal.` };
            }
            questionIds = fisherYatesShuffle(poolIds).slice(0, config.questionCount);
        } else {
            const examQs = await db.select().from(examQuestions).where(eq(examQuestions.examId, examId));
            questionIds = examQs.map(q => q.questionId);
            if (questionIds.length === 0) {
                return { message: "Ujian ini belum memiliki soal. Hubungi pengajar." };
            }
            questionIds = fisherYatesShuffle(questionIds);
        }

        const [result] = await db.insert(examSessions).values({
            userId,
            examId,
            status: "IN_PROGRESS",
            totalQuestions: questionIds.length,
            questionOrder: questionIds,
            startTime: new Date(),
        }).$returningId();

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

        return { success: true, message: "Session reset successfully" };
    } catch (error) {
        console.error("Failed to reset session:", error);
        return { message: "Failed to reset session" };
    }
}

export async function getExamSession(sessionId: number) {
    try {
        const sessionAuth = await auth();
        const currentUserId = sessionAuth?.user?.id;
        if (!currentUserId) return null;

        const session = await db.query.examSessions.findFirst({
            where: eq(examSessions.id, sessionId),
        });

        if (!session) {
            console.error("Session not found for ID:", sessionId);
            return null;
        }

        if (String(session.userId) !== String(currentUserId)) {
            console.error("Session belongs to another user");
            return null;
        }

        // Fetch Exam
        const [exam] = await db.select().from(exams).where(eq(exams.id, session.examId));

        if (!exam) {
            console.error("Exam not found for ID:", session.examId);
            return null;
        }

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

        // Get Questions based on stored order OR default
        let qIds: number[] = [];

        if (session.questionOrder && Array.isArray(session.questionOrder) && session.questionOrder.length > 0) {
            qIds = session.questionOrder as number[];
        } else {
            // Fallback for old sessions or errors: fetch from exam_questions
            const examqs = await db.select().from(examQuestions)
                .where(eq(examQuestions.examId, session.examId))
                .orderBy(examQuestions.order);
            qIds = examqs.map(eq => eq.questionId);
        }

        type QuestionRow = (typeof questions)["$inferSelect"];
        type QuestionWithOptions = QuestionRow & { options: { id: number; content: string; isCorrect?: boolean; questionId?: number }[] };
        let questionsData: QuestionWithOptions[] = [];
        if (qIds.length > 0) {
            const questionRows = await db.select().from(questions)
                .where(inArray(questions.id, qIds));

            const optionsData = await db.select().from(options)
                .where(inArray(options.questionId, qIds));

            questionsData = questionRows.map(q => ({
                ...q,
                options: optionsData.filter(o => o.questionId === q.id)
            }));

            // Sort by the randomized order (qIds)
            questionsData.sort((a, b) => {
                const indexA = qIds.indexOf(a.id);
                const indexB = qIds.indexOf(b.id);
                return indexA - indexB;
            });
        } else {
            console.error("No question IDs found for session!");
        }

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
        const sessionAuth = await auth();
        const currentUserId = sessionAuth?.user?.id;
        if (!currentUserId) return { success: false, message: "Unauthorized" };

        const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId));

        if (!session) return { success: false, message: "Session not found" };
        if (session.userId !== currentUserId) return { success: false, message: "Not your exam session" };
        if (session.status !== "IN_PROGRESS") return { success: false, message: "Exam session is closed" };

        if (!session.startTime) return { success: false, message: "Invalid session start time" };

        const [exam] = await db.select().from(exams).where(eq(exams.id, session.examId));
        if (!exam) return { success: false, message: "Exam not found" };

        const startTime = new Date(session.startTime).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const durationSeconds = exam.duration * 60;

        if (elapsedSeconds > durationSeconds) {
            await finishExam(sessionId);
            return { success: false, message: "Time expired. Exam has been auto-submitted." };
        }

        const allowedQuestionIds: number[] =
            session.questionOrder && Array.isArray(session.questionOrder)
                ? (session.questionOrder as number[])
                : (await db.select({ questionId: examQuestions.questionId }).from(examQuestions).where(eq(examQuestions.examId, session.examId))).map((r) => r.questionId);
        if (!allowedQuestionIds.includes(questionId)) {
            return { success: false, message: "Question is not part of this exam session." };
        }

        const [question] = await db.select().from(questions).where(eq(questions.id, questionId));
        if (!question) return { success: false, message: "Question not found" };

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
        const sessionAuth = await auth();
        const currentUserId = sessionAuth?.user?.id;
        if (!currentUserId) return { success: false, message: "Unauthorized" };

        const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId));

        if (!session) return { success: false, message: "Session not found" };
        if (session.userId !== currentUserId) return { success: false, message: "Not your exam session" };
        if (session.status === "COMPLETED") {
            return { success: true, score: session.score };
        }

        // 1. Daftar soal: paket dinamis pakai questionOrder di session, paket tetap pakai exam_questions
        let qIds: number[];
        if (session.questionOrder && Array.isArray(session.questionOrder)) {
            qIds = session.questionOrder as number[];
        } else {
            const examQs = await db.select().from(examQuestions).where(eq(examQuestions.examId, session.examId));
            qIds = examQs.map(q => q.questionId);
        }
        if (qIds.length === 0) {
            return { success: false, message: "Tidak ada soal untuk dinilai." };
        }

        const questionsData = await db.select().from(questions).where(inArray(questions.id, qIds));
        const optionsData = await db.select().from(options).where(inArray(options.questionId, qIds));
        const userAnswers = await db.select().from(examAnswers).where(eq(examAnswers.sessionId, sessionId));

        // 2. Initialize Category Accumulators
        const stats = {
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

            // Use shared scoring logic (question from DB has compatible shape; weight/answerKeys/rubric may be null or JSON)
            const result = calculateQuestionScore(
                question as ScoringQuestion,
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

        // 4. Calculate Final Weighted Score (selalu 0–100)
        // Bobot: PG 30%, SA 30%, Essay 40%. Jika suatu tipe tidak ada, bobot hanya dari tipe yang ada.
        const scorePG = stats.PG.max > 0 ? (Math.max(0, stats.PG.earned) / stats.PG.max) * 30 : 0;
        const scoreSA = stats.SA.max > 0 ? (stats.SA.earned / stats.SA.max) * 30 : 0;
        const scoreEssay = stats.ESSAY.max > 0 ? (stats.ESSAY.earned / stats.ESSAY.max) * 40 : 0;

        const totalWeight =
            (stats.PG.max > 0 ? 30 : 0) + (stats.SA.max > 0 ? 30 : 0) + (stats.ESSAY.max > 0 ? 40 : 0);
        const rawSum = scorePG + scoreSA + scoreEssay;
        const finalScore =
            totalWeight > 0 ? Math.round((rawSum / totalWeight) * 100) : 0;

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

    if (!userId) {
        return { data: [], total: 0, page: 1, limit: 5, totalPages: 0 };
    }

    const safeLimit = Math.max(1, limit);
    const safePage = Math.max(1, page);

    try {
        // Get total count
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
            .from(examSessions)
            .where(eq(examSessions.userId, userId));

        const total = Number(countResult?.count || 0);
        const totalPages = Math.ceil(total / safeLimit);
        const offset = (safePage - 1) * safeLimit;

        // Get paginated data
        const history = await db.select({
            id: examSessions.id,
            date: examSessions.endTime,
            score: examSessions.score,
            totalQuestions: examSessions.totalQuestions,
            status: examSessions.status,
            examTitle: exams.title,
            feedback: examSessions.feedback,
        })
            .from(examSessions)
            .leftJoin(exams, eq(examSessions.examId, exams.id))
            .where(eq(examSessions.userId, userId))
            .orderBy(desc(examSessions.startTime))
            .limit(safeLimit)
            .offset(offset);

        return {
            data: history,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages
        };
    } catch (error) {
        console.error("Failed to fetch exam history:", error);
        return { data: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 };
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
        if (!exam) return { success: false, message: "Ujian tidak ditemukan (mungkin telah dihapus)." };

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

/** Question payload for scoring simulation (e.g. from QuestionForm preview). Matches shape expected by calculateQuestionScore. */
export interface SimulateQuestionPayload {
    type: string;
    weight?: number;
    answerKeys?: { key: string; type: "TEXT" | "NUMERIC"; tolerance?: number }[];
    rubric?: { component: string; keywords: string | string[]; points: number }[];
    options?: { id: number; isCorrect?: boolean; questionId?: number }[];
}

export async function simulateQuestionScore(
    questionData: SimulateQuestionPayload,
    answer: string
) {
    try {
        const session = await auth();
        if (!session?.user) return { success: false, message: "Unauthorized" };

        let optionsData: { id: number; isCorrect?: boolean; questionId?: number }[] = [];
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
