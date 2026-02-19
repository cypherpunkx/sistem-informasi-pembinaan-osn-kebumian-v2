/**
 * Seed script untuk membuat soal OSN Kebumian.
 * Jalankan: npm run db:seed
 *
 * Memerlukan DATABASE_URL di .env
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../lib/schema";
import { questions, options } from "../lib/schema";

async function getDb() {
    const connection = await mysql.createPool({
        uri: process.env.DATABASE_URL,
    });
    return drizzle(connection, { schema, mode: "default" });
}

const seedQuestions = [
    // --- MULTIPLE_CHOICE ---
    {
        content: "Batuan beku yang terbentuk dari hasil pembekuan magma di bawah permukaan bumi dengan pendinginan lambat disebut batuan …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Petrologi",
        subtopic: "Batuan Beku",
        difficulty: "EASY" as const,
        year: 2024,
        source: "OSN Kebumian 2024",
        explanation:
            "Batuan intrusif/plutonik terbentuk dari magma yang membeku di bawah permukaan bumi. Pendinginan lambat memungkinkan kristal berkembang dengan baik.",
        tags: ["batuan beku", "magma", "intrusif"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: null,
        rubric: null,
        options: [
            { content: "Ekstrusif", isCorrect: false },
            { content: "Intrusif", isCorrect: true },
            { content: "Vulkanik", isCorrect: false },
            { content: "Hipabissal", isCorrect: false },
        ],
    },
    {
        content: "Mineral yang termasuk dalam kelompok silikat dan merupakan mineral penyusun utama kerak bumi adalah …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Mineralogi",
        subtopic: "Silikat",
        difficulty: "EASY" as const,
        year: 2023,
        source: "OSN Kebumian 2023",
        explanation:
            "Felspar (feldspar) adalah mineral silikat yang paling melimpah di kerak bumi, menyusun sekitar 60% kerak benua.",
        tags: ["mineral", "silikat", "felspar"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: null,
        rubric: null,
        options: [
            { content: "Kuarsa", isCorrect: false },
            { content: "Felspar", isCorrect: true },
            { content: "Olivin", isCorrect: false },
            { content: "Biotit", isCorrect: false },
        ],
    },
    {
        content: "Proses yang menyebabkan terbentuknya pegunungan lipatan (fold mountain) terutama disebabkan oleh gaya …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Geologi Struktur",
        subtopic: "Tektonik",
        difficulty: "MEDIUM" as const,
        year: 2024,
        source: "Latihan OSN",
        explanation:
            "Gaya kompresi (tekan) pada batuan sedimen menimbulkan lipatan dan menghasilkan pegunungan lipatan seperti Pegunungan Himalaya.",
        tags: ["tektonik", "lipatan", "kompresi"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: null,
        rubric: null,
        options: [
            { content: "Tarik (tension)", isCorrect: false },
            { content: "Tekan (compression)", isCorrect: true },
            { content: "Geser (shear)", isCorrect: false },
            { content: "Gravitasi", isCorrect: false },
        ],
    },
    // --- SHORT_ANSWER ---
    {
        content: "Sebutkan nama lapisan bumi yang memiliki ketebalan sekitar 2.900 km dan memisahkan mantel dengan inti bumi.",
        type: "SHORT_ANSWER" as const,
        topic: "Geofisika",
        subtopic: "Struktur Bumi",
        difficulty: "EASY" as const,
        year: 2024,
        source: "OSN Kebumian 2024",
        explanation:
            "Batas Mantel-Inti (CMB - Core-Mantle Boundary) adalah zona transisi antara mantel dan inti luar. Ketebalan mantel sekitar 2.900 km.",
        tags: ["struktur bumi", "mantel", "inti"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: [{ key: "batas mantel inti", tolerance: 0 }, { key: "CMB", tolerance: 0 }, { key: "core-mantle boundary", tolerance: 0 }],
        rubric: null,
        options: [],
    },
    {
        content: "Berapa skala Richter minimum yang umumnya menimbulkan kerusakan pada bangunan? (jawab dalam angka bulat)",
        type: "SHORT_ANSWER" as const,
        topic: "Geofisika",
        subtopic: "Seismologi",
        difficulty: "MEDIUM" as const,
        year: 2023,
        source: "Latihan Seismologi",
        explanation:
            "Gempa dengan magnitude 5.0 skala Richter ke atas umumnya mulai menimbulkan kerusakan pada struktur bangunan yang tidak tahan gempa.",
        tags: ["gempa", "skala Richter", "seismologi"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: [{ key: "5", type: "NUMERIC" as const, tolerance: 0 }],
        rubric: null,
        options: [],
    },
    // --- ESSAY ---
    {
        content:
            "Jelaskan proses siklus batuan (rock cycle) dari batuan beku hingga kembali menjadi magma. Uraikan minimal 3 tahap utama beserta kondisi yang diperlukan.",
        type: "ESSAY" as const,
        topic: "Petrologi",
        subtopic: "Siklus Batuan",
        difficulty: "HARD" as const,
        year: 2024,
        source: "OSN Kebumian 2024",
        explanation: null,
        tags: ["siklus batuan", "petrologi", "proses geologi"],
        status: "PUBLISHED" as const,
        weight: 2,
        answerKeys: null,
        rubric: [
            { component: "Batuan beku → pelapukan/erosi", keywords: ["pelapukan", "erosi", "pelapukan mekanik", "kimia"], points: 1 },
            { component: "Sedimen → batuan sedimen", keywords: ["kompaksi", "sementasi", "litifikasi", "diagenesis"], points: 1 },
            { component: "Batuan sedimen/metamorf → magma", keywords: ["metamorfisme", "lebur", "mencair", "zona subduksi", "panas"], points: 1 },
        ],
        options: [],
    },
];

async function main() {
    const db = await getDb();
    console.log("🌱 Memulai seed soal OSN Kebumian...");

    for (const q of seedQuestions) {
        const { options: opts, ...questionData } = q;
        const data = {
            ...questionData,
            answerKeys: questionData.answerKeys ?? null,
            rubric: questionData.rubric ?? null,
            tags: questionData.tags ?? null,
        };

        const [inserted] = await db.insert(questions).values(data).$returningId();

        if (opts.length > 0) {
            await db.insert(options).values(
                opts.map((o) => ({
                    questionId: inserted.id,
                    content: o.content,
                    isCorrect: o.isCorrect,
                }))
            );
        }

        console.log(`  ✓ Soal: "${questionData.content.substring(0, 50)}..." (ID: ${inserted.id})`);
    }

    console.log(`\n✅ Seed selesai. ${seedQuestions.length} soal berhasil ditambahkan.`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed gagal:", err);
        process.exit(1);
    });
