/**
 * Seed data untuk laporan & analytics: users (peserta), exams, exam_sessions,
 * exam_answers, user_progress, news, news_views, pages, soal_archives.
 *
 * Prasyarat: jalankan dulu db:seed:all agar topics, questions, materials ada.
 * Jalankan: npx tsx scripts/seed-analytics.ts
 * atau: npm run db:seed:analytics
 *
 * Memerlukan DATABASE_URL di .env.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import * as schema from "../lib/schema";
import {
    users,
    questions,
    exams,
    examQuestions,
    examSessions,
    examAnswers,
    materials,
    userProgress,
    news,
    newsViews,
    pages,
    pageSections,
    soalArchives,
} from "../lib/schema";

const PESERTA_SEED = [
    { name: "Ahmad Peserta", email: "peserta1@demo.osn.local", password: "password123", school: "SMA Demo 1", competitionCategory: "OSN" },
    { name: "Budi Santoso", email: "peserta2@demo.osn.local", password: "password123", school: "SMA Demo 2", competitionCategory: "OSN" },
    { name: "Citra Wijaya", email: "peserta3@demo.osn.local", password: "password123", school: "SMA Demo 3", competitionCategory: "Latihan" },
];

const EXAMS_SEED = [
    { title: "Try Out OSN Kebumian 2024", description: "Ujian simulasi OSN kategori Geology & Meteorology", duration: 60, type: "FIXED" as const, category: "OSN" },
    { title: "Latihan Harian - Geologi", description: "Latihan topik Geologi", duration: 30, type: "FIXED" as const, category: "Latihan Harian" },
    { title: "Quiz Astronomi & Oseanografi", description: "Quiz singkat multi topik", duration: 45, type: "DYNAMIC" as const, category: "Latihan" },
];

const NEWS_SEED = [
    { title: "Jadwal OSN Kebumian 2024", slug: "jadwal-osn-kebumian-2024", category: "jadwal", summary: "Pengumuman jadwal resmi OSN Kebumian 2024.", content: "<p>Jadwal akan diumumkan melalui laman ini.</p>", status: "PUBLISHED" as const },
    { title: "Panduan Pendaftaran Peserta", slug: "panduan-pendaftaran-peserta", category: "pengumuman", summary: "Panduan lengkap pendaftaran peserta OSN Kebumian.", content: "<p>Silakan ikuti langkah pendaftaran di portal.</p>", status: "PUBLISHED" as const },
];

const PAGES_SEED = [
    { slug: "persiapan", title: "Persiapan OSN Kebumian", description: "Panduan persiapan", template: "persiapan", content: null, publishedAt: new Date() },
    { slug: "silabus", title: "Silabus OSN Kebumian", description: "Ruang lingkup materi", template: "silabus", content: null, publishedAt: new Date() },
    { slug: "tentang", title: "Tentang OSN Kebumian", description: "Informasi umum", template: "tentang", content: "<p>Tentang Olimpiade Sains Nasional bidang Kebumian.</p>", publishedAt: new Date() },
];

const SOAL_ARCHIVES_SEED = [
    { tahun: 2023, tahap: "Provinsi", jenjang: "SMA", title: "OSN Kebumian 2023 Provinsi", soalUrl: "https://example.com/arsip/2023-prov.pdf", pembahasanUrl: "https://example.com/arsip/2023-prov-pembahasan.pdf", publishedAt: new Date("2023-06-01") },
    { tahun: 2023, tahap: "Nasional", jenjang: "SMA", title: "OSN Kebumian 2023 Nasional", soalUrl: "https://example.com/arsip/2023-nas.pdf", pembahasanUrl: null, publishedAt: new Date("2023-09-01") },
    { tahun: 2024, tahap: "Kabupaten/Kota", jenjang: "SMA", title: "OSN Kebumian 2024 Kab/Kota", soalUrl: "https://example.com/arsip/2024-kab.pdf", pembahasanUrl: null, publishedAt: new Date("2024-03-01") },
];

async function getDb() {
    const connection = await mysql.createPool({ uri: process.env.DATABASE_URL });
    return { db: drizzle(connection, { schema, mode: "default" }), connection };
}

function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

function addMinutes(date: Date, minutes: number): Date {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + minutes);
    return d;
}

async function main() {
    const { db, connection } = await getDb();
    console.log("🌱 Seed Analytics & Laporan\n");

    const participantIds: number[] = [];

    // --- Users (peserta) ---
    console.log("👤 Users (peserta)");
    const passwordHash = await hash("password123", 10);
    for (const p of PESERTA_SEED) {
        const existing = await db.query.users.findFirst({ where: eq(users.email, p.email) });
        if (!existing) {
            const [inserted] = await db.insert(users).values({
                name: p.name,
                email: p.email,
                password: passwordHash,
                role: "peserta",
                school: p.school ?? null,
                competitionCategory: p.competitionCategory ?? null,
            }).$returningId();
            participantIds.push(inserted.id);
            console.log(`  ✓ ${p.email}`);
        } else {
            participantIds.push(existing.id);
            console.log(`  - ${p.email} (sudah ada)`);
        }
    }
    if (participantIds.length === 0) {
        const anyPeserta = await db.query.users.findFirst({ where: eq(users.role, "peserta") });
        if (anyPeserta) {
            participantIds.push(anyPeserta.id);
            console.log("  - Menggunakan peserta yang sudah ada");
        }
    }
    if (participantIds.length === 0) {
        console.warn("  ⚠ Tidak ada user peserta. Buat minimal 1 peserta atau jalankan seed-admin lalu daftar manual. Session akan di-skip.");
    }

    // --- Soal PUBLISHED untuk exam ---
    const publishedQuestions = await db
        .select({ id: questions.id })
        .from(questions)
        .where(eq(questions.status, "PUBLISHED"))
        .limit(15);
    const questionIds = publishedQuestions.map((q) => q.id);
    if (questionIds.length < 3) {
        console.warn("  ⚠ Soal PUBLISHED < 3. Jalankan db:seed:all dulu. Exam akan pakai soal yang ada.");
    }

    // --- Exams + exam_questions ---
    console.log("\n📋 Exams");
    const examIds: number[] = [];
    for (const ex of EXAMS_SEED) {
        const existing = await db.query.exams.findFirst({ where: eq(exams.title, ex.title) });
        if (!existing) {
            const [inserted] = await db.insert(exams).values({
                title: ex.title,
                description: ex.description ?? null,
                duration: ex.duration,
                type: ex.type,
                category: ex.category ?? null,
                isActive: true,
            }).$returningId();
            examIds.push(inserted.id);
            const qty = Math.min(5, questionIds.length);
            const qIds = questionIds.slice(0, qty);
            await db.insert(examQuestions).values(
                qIds.map((qId, i) => ({ examId: inserted.id, questionId: qId, order: i + 1 }))
            );
            console.log(`  ✓ ${ex.title} (${qty} soal)`);
        } else {
            examIds.push(existing.id);
            console.log(`  - ${ex.title} (sudah ada)`);
        }
    }
    if (examIds.length === 0) {
        const anyExam = await db.query.exams.findFirst();
        if (anyExam) examIds.push(anyExam.id);
    }

    // --- Exam sessions (untuk trend + distribution + summary) ---
    console.log("\n📊 Exam sessions (untuk grafik laporan)");
    const existingSessionCount = await db.select({ id: examSessions.id }).from(examSessions);
    const maxSessionsToAdd = 40;
    const scoresForDistribution = [35, 42, 55, 58, 62, 68, 72, 78, 85, 88, 92];
    let sessionsAdded = 0;
    if (existingSessionCount.length < maxSessionsToAdd && examIds.length > 0 && participantIds.length > 0) {
        for (let day = 0; day < 30 && sessionsAdded < maxSessionsToAdd - existingSessionCount.length; day++) {
            const startDate = daysAgo(day);
            const examsThisDay = 1 + (day % Math.min(3, examIds.length));
            for (let i = 0; i < examsThisDay && sessionsAdded < maxSessionsToAdd - existingSessionCount.length; i++) {
                const examId = examIds[sessionsAdded % examIds.length];
                const userId = String(participantIds[(day + i) % participantIds.length]);
                const score = scoresForDistribution[(day + i) % scoresForDistribution.length];
                const startTime = new Date(startDate);
                startTime.setHours(9 + (i % 4), (i * 7) % 60, 0, 0);
                const endTime = addMinutes(startTime, 45);
                const totalQ = 10;
                const correctQ = Math.round((score / 100) * totalQ);
                await db.insert(examSessions).values({
                    userId,
                    examId,
                    startTime,
                    endTime,
                    score,
                    totalQuestions: totalQ,
                    correctAnswers: correctQ,
                    status: "COMPLETED",
                });
                sessionsAdded++;
            }
        }
        console.log(`  ✓ ${sessionsAdded} sesi (COMPLETED) ditambahkan`);
    } else {
        console.log(`  - Sesi sudah cukup (${existingSessionCount.length}) atau belum ada exam/peserta`);
    }

    // --- Exam answers (opsional, 1 session contoh) ---
    const oneSession = await db
        .select({ id: examSessions.id, examId: examSessions.examId })
        .from(examSessions)
        .where(eq(examSessions.status, "COMPLETED"))
        .limit(1);
    if (oneSession.length > 0 && questionIds.length > 0) {
        const sessionId = oneSession[0].id;
        const count = await db
            .select({ id: examAnswers.id })
            .from(examAnswers)
            .where(eq(examAnswers.sessionId, sessionId))
            .limit(1);
        if (count.length === 0) {
            const qIds = questionIds.slice(0, 3);
            await db.insert(examAnswers).values(
                qIds.map((qId, i) => ({
                    sessionId,
                    questionId: qId,
                    answer: String(i + 1),
                    isCorrect: i % 2 === 0,
                    score: i % 2 === 0 ? 1 : 0,
                }))
            );
            console.log("  ✓ Sample exam_answers untuk 1 sesi");
        }
    }

    // --- User progress (materi) ---
    const materialList = await db.select({ id: materials.id }).from(materials).limit(5);
    if (materialList.length > 0 && participantIds.length > 0) {
        for (let i = 0; i < Math.min(3, participantIds.length); i++) {
            const uid = String(participantIds[i]);
            const mid = materialList[i % materialList.length].id;
            const exists = await db
                .select({ id: userProgress.id })
                .from(userProgress)
                .where(and(eq(userProgress.userId, uid), eq(userProgress.materialId, mid)))
                .limit(1);
            if (exists.length === 0) {
                await db.insert(userProgress).values({
                    userId: uid,
                    materialId: mid,
                    isCompleted: i === 0,
                    completedAt: i === 0 ? new Date() : null,
                });
            }
        }
        console.log("  ✓ user_progress (sample)");
    }

    // --- News ---
    console.log("\n📰 News");
    for (const n of NEWS_SEED) {
        const existing = await db.query.news.findFirst({ where: eq(news.slug, n.slug) });
        if (!existing) {
            await db.insert(news).values({
                ...n,
                publishedAt: new Date(),
                createdBy: null,
            });
            console.log(`  ✓ ${n.slug}`);
        } else {
            console.log(`  - ${n.slug} (sudah ada)`);
        }
    }

    // --- News views ---
    const newsRows = await db.select({ id: news.id }).from(news).limit(5);
    for (const row of newsRows) {
        for (let v = 0; v < 3; v++) {
            const t = daysAgo(v * 2);
            await db.insert(newsViews).values({ newsId: row.id, viewedAt: t }).catch(() => {});
        }
    }
    if (newsRows.length > 0) console.log("  ✓ news_views (sample)");

    // --- Pages + sections ---
    console.log("\n📄 Pages");
    for (const pg of PAGES_SEED) {
        const existing = await db.query.pages.findFirst({ where: eq(pages.slug, pg.slug) });
        if (!existing) {
            const [inserted] = await db.insert(pages).values({
                slug: pg.slug,
                title: pg.title,
                description: pg.description ?? null,
                template: pg.template ?? "default",
                content: pg.content ?? null,
                publishedAt: pg.publishedAt ?? null,
            }).$returningId();
            await db.insert(pageSections).values({
                pageId: inserted.id,
                sectionKey: "intro",
                title: pg.title,
                content: pg.content ?? `<p>Konten ${pg.title}.</p>`,
                sortOrder: 0,
            });
            console.log(`  ✓ ${pg.slug}`);
        } else {
            console.log(`  - ${pg.slug} (sudah ada)`);
        }
    }

    // --- Soal archives ---
    console.log("\n📁 Soal archives");
    for (const ar of SOAL_ARCHIVES_SEED) {
        const existing = await db.query.soalArchives.findFirst({
            where: and(
                eq(soalArchives.tahun, ar.tahun),
                eq(soalArchives.tahap, ar.tahap),
                eq(soalArchives.jenjang, ar.jenjang)
            ),
        });
        if (!existing) {
            await db.insert(soalArchives).values({
                ...ar,
                pembahasanUrl: ar.pembahasanUrl ?? null,
            });
            console.log(`  ✓ ${ar.tahun} ${ar.tahap}`);
        } else {
            console.log(`  - ${ar.tahun} ${ar.tahap} (sudah ada)`);
        }
    }

    await connection.end();
    console.log("\n✅ Seed analytics selesai. Dashboard Laporan akan menampilkan data grafik.");
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed analytics gagal:", err);
        process.exit(1);
    });
