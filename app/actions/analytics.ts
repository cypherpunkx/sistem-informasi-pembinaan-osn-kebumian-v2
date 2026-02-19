"use server";

import { db } from "@/lib/db";
import { questions, examAnswers, examSessions, users } from "@/lib/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { getTopicAccuracy } from "@/app/actions/recommendations";

export interface TopicScoreTrendPoint {
    period: string;
    topic: string;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
}

export interface TopicScoreTrendSeries {
    period: string;
    data: { topic: string; accuracy: number }[];
}

export interface DominantWeakness {
    topic: string;
    accuracy: number;
    totalQuestions: number;
}

export interface SubtopicWeakness {
    subtopic: string;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
}

export interface HighDifficultyFailure {
    userId: string;
    userName: string;
    topic: string;
    failCount: number;
}

/** Senin dari minggu yang berisi tanggal d (ISO week start). */
function getMonday(d: Date): Date {
    const x = new Date(d);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
}

/** Generate kunci period (YYYY-MM-DD Senin) untuk N minggu terakhir, terurut dari paling lama. */
function getLastNWeekKeys(n: number): string[] {
    const keys: string[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const monday = getMonday(d);
        keys.push(monday.toISOString().slice(0, 10));
    }
    return [...new Set(keys)].sort();
}

/** Options for trend: bucket by week (Senin), last N weeks, isi minggu kosong. */
export async function getTopicScoreTrend(
    requestedUserId?: string,
    options?: { weeks?: number }
): Promise<TopicScoreTrendSeries[]> {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const role = session?.user?.role as string | undefined;
    const userId = requestedUserId ?? currentUserId;
    if (!userId) return [];
    if (requestedUserId && requestedUserId !== currentUserId && role !== "pembina" && role !== "admin") return [];

    const weeks = Math.min(12, Math.max(4, options?.weeks ?? 8));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    try {
        const rows = await db
            .select({
                topic: questions.topic,
                isCorrect: examAnswers.isCorrect,
                endTime: examSessions.endTime,
            })
            .from(examAnswers)
            .innerJoin(examSessions, eq(examAnswers.sessionId, examSessions.id))
            .innerJoin(questions, eq(examAnswers.questionId, questions.id))
            .where(
                and(
                    eq(examSessions.userId, String(userId)),
                    eq(examSessions.status, "COMPLETED"),
                    sql`${examSessions.endTime} >= ${startDate}`
                )
            )
            .orderBy(examSessions.endTime);

        type PeriodKey = string;
        const byPeriod = new Map<PeriodKey, Map<string, { total: number; correct: number }>>();
        const allTopics = new Set<string>();

        for (const row of rows) {
            const endTime = row.endTime ? new Date(row.endTime) : null;
            if (!endTime) continue;
            const periodKey = getMonday(endTime).toISOString().slice(0, 10);
            const topic = row.topic || "Uncategorized";
            allTopics.add(topic);

            if (!byPeriod.has(periodKey)) {
                byPeriod.set(periodKey, new Map());
            }
            const topicMap = byPeriod.get(periodKey)!;
            if (!topicMap.has(topic)) topicMap.set(topic, { total: 0, correct: 0 });
            const d = topicMap.get(topic)!;
            d.total++;
            if (row.isCorrect) d.correct++;
        }

        const expectedPeriods = getLastNWeekKeys(weeks);
        const topicList = Array.from(allTopics);

        const series: TopicScoreTrendSeries[] = expectedPeriods.map((period) => {
            const topicMap = byPeriod.get(period);
            const data = topicList.map((topic) => {
                const v = topicMap?.get(topic);
                const accuracy = v && v.total ? (v.correct / v.total) * 100 : 0;
                return { topic, accuracy };
            });
            return { period, data };
        });

        return series;
    } catch (error) {
        console.error("getTopicScoreTrend failed:", error);
        return [];
    }
}

/** Batas akurasi (%). Topik dengan akurasi >= ini tidak dianggap kelemahan dominan. Selaras dengan priority LOW di getTopicAccuracy. */
const WEAKNESS_ACCURACY_THRESHOLD = 80;

/**
 * Top N topik terlemah (akurasi terendah) yang benar-benar di bawah batas.
 * Hanya mengembalikan topik dengan akurasi < WEAKNESS_ACCURACY_THRESHOLD (80%),
 * sehingga topik dengan performa baik (mis. 100%) tidak tampil sebagai kelemahan.
 */
export async function getDominantWeaknesses(
    requestedUserId?: string,
    limit: number = 5
): Promise<DominantWeakness[]> {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const role = session?.user?.role as string | undefined;
    const userId = requestedUserId ?? currentUserId;
    if (!userId) return [];
    if (requestedUserId && requestedUserId !== currentUserId && role !== "pembina" && role !== "admin") return [];

    const accuracy = await getTopicAccuracy(userId);
    const weakOnly = accuracy.filter((a) => a.accuracy < WEAKNESS_ACCURACY_THRESHOLD);
    return weakOnly
        .slice(0, limit)
        .map((a) => ({ topic: a.topic, accuracy: a.accuracy, totalQuestions: a.totalQuestions }));
}

/**
 * Akurasi per subtopik (untuk angkatan atau satu user).
 * Hanya mengembalikan subtopik dengan akurasi < WEAKNESS_ACCURACY_THRESHOLD (80%),
 * agar "Subtopik paling bermasalah" tidak menampilkan subtopik yang performanya sudah baik.
 */
export async function getSubtopicWeaknesses(requestedUserId?: string): Promise<SubtopicWeakness[]> {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    if (requestedUserId) {
        const currentUserId = session?.user?.id;
        if (currentUserId !== requestedUserId && role !== "pembina" && role !== "admin") return [];
    } else if (role !== "pembina" && role !== "admin") {
        return [];
    }

    try {
        const rows = await db
            .select({
                subtopic: questions.subtopic,
                isCorrect: examAnswers.isCorrect,
            })
            .from(examSessions)
            .innerJoin(examAnswers, eq(examAnswers.sessionId, examSessions.id))
            .innerJoin(questions, eq(examAnswers.questionId, questions.id))
            .where(
                requestedUserId
                    ? and(eq(examSessions.status, "COMPLETED"), eq(examSessions.userId, String(requestedUserId)))
                    : eq(examSessions.status, "COMPLETED")
            );

        const accMap = new Map<string, { total: number; correct: number }>();
        for (const row of rows) {
            const sub = row.subtopic || "Uncategorized";
            if (!accMap.has(sub)) accMap.set(sub, { total: 0, correct: 0 });
            const d = accMap.get(sub)!;
            d.total++;
            if (row.isCorrect) d.correct++;
        }

        const result: SubtopicWeakness[] = [];
        accMap.forEach((d, subtopic) => {
            const accuracy = d.total ? (d.correct / d.total) * 100 : 0;
            result.push({
                subtopic,
                totalQuestions: d.total,
                correctAnswers: d.correct,
                accuracy,
            });
        });
        const weakOnly = result.filter((r) => r.accuracy < WEAKNESS_ACCURACY_THRESHOLD);
        return weakOnly.sort((a, b) => a.accuracy - b.accuracy);
    } catch (error) {
        console.error("getSubtopicWeaknesses failed:", error);
        return [];
    }
}

/** HARD questions failed. For pembina: no userId = all peserta. For one user: pass userId. */
export async function getHighDifficultyFailures(requestedUserId?: string): Promise<HighDifficultyFailure[]> {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    const currentUserId = session?.user?.id;
    if (requestedUserId && requestedUserId !== currentUserId && role !== "pembina" && role !== "admin") return [];
    if (!requestedUserId && role !== "pembina" && role !== "admin") return [];

    try {
        const conditions = [
            eq(examSessions.status, "COMPLETED"),
            eq(questions.difficulty, "HARD"),
            eq(examAnswers.isCorrect, false),
        ];
        if (requestedUserId) {
            conditions.push(eq(examSessions.userId, String(requestedUserId)));
        }

        const rows = await db
            .select({
                userId: examSessions.userId,
                topic: questions.topic,
            })
            .from(examAnswers)
            .innerJoin(examSessions, eq(examAnswers.sessionId, examSessions.id))
            .innerJoin(questions, eq(examAnswers.questionId, questions.id))
            .where(and(...conditions));

        const agg = new Map<string, { userId: string; topic: string; count: number }>();
        for (const row of rows) {
            const key = `${row.userId}|${row.topic || "Uncategorized"}`;
            if (!agg.has(key)) agg.set(key, { userId: row.userId, topic: row.topic || "Uncategorized", count: 0 });
            agg.get(key)!.count++;
        }

        const list: HighDifficultyFailure[] = [];
        const userIds = [...new Set(Array.from(agg.values()).map((v) => v.userId))];
        const nameMap = new Map<string, string>();
        if (userIds.length > 0) {
            const numericIds = userIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
            if (numericIds.length > 0) {
                const us = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, numericIds));
                us.forEach((u) => nameMap.set(String(u.id), u.name || ""));
            }
        }
        agg.forEach((v) => {
            list.push({
                userId: v.userId,
                userName: nameMap.get(v.userId) || v.userId,
                topic: v.topic,
                failCount: v.count,
            });
        });
        return list.sort((a, b) => b.failCount - a.failCount);
    } catch (error) {
        console.error("getHighDifficultyFailures failed:", error);
        return [];
    }
}

/** Consistency label per student (Stagnan / Naik / Turun / Stabil) based on last 3 weeks. Pembina only. */
export async function getConsistencyLabels(): Promise<{ userId: string; label: string }[]> {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    if (role !== "pembina" && role !== "admin") return [];

    try {
        const threeWeeksAgo = new Date();
        threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

        const rows = await db
            .select({
                userId: examSessions.userId,
                score: examSessions.score,
                endTime: examSessions.endTime,
            })
            .from(examSessions)
            .where(and(eq(examSessions.status, "COMPLETED"), sql`${examSessions.endTime} >= ${threeWeeksAgo}`));

        const byUser = new Map<string, { score: number; weekKey: string }[]>();
        for (const row of rows) {
            if (row.score == null || !row.endTime) continue;
            const d = new Date(row.endTime);
            const weekKey = getMonday(d).toISOString().slice(0, 10);
            if (!byUser.has(row.userId)) byUser.set(row.userId, []);
            byUser.get(row.userId)!.push({ score: row.score, weekKey });
        }

        const result: { userId: string; label: string }[] = [];
        byUser.forEach((entries, userId) => {
            const byWeek = new Map<string, number[]>();
            entries.forEach((e) => {
                if (!byWeek.has(e.weekKey)) byWeek.set(e.weekKey, []);
                byWeek.get(e.weekKey)!.push(e.score);
            });
            const weekAvgs = Array.from(byWeek.entries())
                .map(([k, v]) => ({ week: k, avg: v.reduce((a, b) => a + b, 0) / v.length }))
                .sort((a, b) => a.week.localeCompare(b.week));
            if (weekAvgs.length < 2) {
                result.push({ userId, label: "Stabil" });
                return;
            }
            const last = weekAvgs[weekAvgs.length - 1].avg;
            const prev = weekAvgs[weekAvgs.length - 2].avg;
            const third = weekAvgs.length >= 3 ? weekAvgs[weekAvgs.length - 3].avg : null;
            if (third != null && last <= prev && prev <= third) {
                result.push({ userId, label: "Stagnan" });
            } else if (last > prev) {
                result.push({ userId, label: "Naik" });
            } else if (last < prev) {
                result.push({ userId, label: "Turun" });
            } else {
                result.push({ userId, label: "Stabil" });
            }
        });
        return result;
    } catch (error) {
        console.error("getConsistencyLabels failed:", error);
        return [];
    }
}

/** Cohort recommendation summary: topic -> count of participants who need practice (HIGH/MEDIUM). Pembina only. */
export async function getCohortRecommendationSummary(): Promise<{ topic: string; participantCount: number }[]> {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    if (role !== "pembina" && role !== "admin") return [];

    try {
        const peserta = await db.select({ id: users.id }).from(users).where(eq(users.role, "peserta"));
        const topicCount = new Map<string, number>();

        for (const p of peserta) {
            const uid = String(p.id);
            const acc = await getTopicAccuracy(uid);
            const needsPractice = acc.filter((a) => a.priority === "HIGH" || a.priority === "MEDIUM");
            for (const a of needsPractice) {
                topicCount.set(a.topic, (topicCount.get(a.topic) ?? 0) + 1);
            }
        }

        return Array.from(topicCount.entries())
            .map(([topic, participantCount]) => ({ topic, participantCount }))
            .sort((a, b) => b.participantCount - a.participantCount);
    } catch (error) {
        console.error("getCohortRecommendationSummary failed:", error);
        return [];
    }
}
