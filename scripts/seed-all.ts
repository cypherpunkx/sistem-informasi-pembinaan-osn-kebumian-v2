/**
 * Seed script: topics, questions (dengan options), dan materials.
 * Schema mengacu ke lib/schema.ts (questions, options, topics, materials).
 *
 * Jalankan: npx tsx scripts/seed-all.ts
 * atau: npm run db:seed:all
 *
 * Memerlukan DATABASE_URL di .env
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import * as schema from "../lib/schema";
import { topics, questions, options, materials } from "../lib/schema";

const TOPICS = [
    { name: "Geology", sortOrder: 1 },
    { name: "Meteorology", sortOrder: 2 },
    { name: "Astronomy", sortOrder: 3 },
    { name: "Oceanography", sortOrder: 4 },
];

const SEED_QUESTIONS = [
    // --- MULTIPLE_CHOICE ---
    {
        content:
            "Batuan beku yang terbentuk dari hasil pembekuan magma di bawah permukaan bumi dengan pendinginan lambat disebut batuan …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Geology",
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
        content:
            "Mineral yang termasuk dalam kelompok silikat dan merupakan mineral penyusun utama kerak bumi adalah …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Geology",
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
        content:
            "Proses yang menyebabkan terbentuknya pegunungan lipatan (fold mountain) terutama disebabkan oleh gaya …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Geology",
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
    {
        content: "Lapisan atmosfer tempat terjadinya fenomena cuaca dan awan adalah …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Meteorology",
        subtopic: "Atmosfer",
        difficulty: "EASY" as const,
        year: 2024,
        source: "OSN Kebumian 2024",
        explanation: "Troposfer adalah lapisan terbawah atmosfer (0–12 km) tempat terjadinya cuaca, awan, dan hujan.",
        tags: ["atmosfer", "troposfer", "cuaca"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: null,
        rubric: null,
        options: [
            { content: "Stratosfer", isCorrect: false },
            { content: "Troposfer", isCorrect: true },
            { content: "Mesosfer", isCorrect: false },
            { content: "Termosfer", isCorrect: false },
        ],
    },
    {
        content: "Planet yang memiliki cincin paling terlihat dari Bumi adalah …",
        type: "MULTIPLE_CHOICE" as const,
        topic: "Astronomy",
        subtopic: "Tata Surya",
        difficulty: "EASY" as const,
        year: 2023,
        source: "OSN Kebumian 2023",
        explanation: "Saturnus memiliki sistem cincin yang paling luas dan terang, dapat diamati dengan teleskop kecil.",
        tags: ["tata surya", "Saturnus", "cincin"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: null,
        rubric: null,
        options: [
            { content: "Jupiter", isCorrect: false },
            { content: "Saturnus", isCorrect: true },
            { content: "Uranus", isCorrect: false },
            { content: "Neptunus", isCorrect: false },
        ],
    },
    // --- SHORT_ANSWER ---
    {
        content:
            "Sebutkan nama lapisan bumi yang memiliki ketebalan sekitar 2.900 km dan memisahkan mantel dengan inti bumi.",
        type: "SHORT_ANSWER" as const,
        topic: "Geology",
        subtopic: "Struktur Bumi",
        difficulty: "EASY" as const,
        year: 2024,
        source: "OSN Kebumian 2024",
        explanation:
            "Batas Mantel-Inti (CMB - Core-Mantle Boundary) adalah zona transisi antara mantel dan inti luar.",
        tags: ["struktur bumi", "mantel", "inti"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: [
            { key: "batas mantel inti", tolerance: 0 },
            { key: "CMB", tolerance: 0 },
            { key: "core-mantle boundary", tolerance: 0 },
        ],
        rubric: null,
        options: [],
    },
    {
        content:
            "Berapa skala Richter minimum yang umumnya menimbulkan kerusakan pada bangunan? (jawab dalam angka bulat)",
        type: "SHORT_ANSWER" as const,
        topic: "Geology",
        subtopic: "Seismologi",
        difficulty: "MEDIUM" as const,
        year: 2023,
        source: "Latihan Seismologi",
        explanation: "Gempa dengan magnitude 5.0 skala Richter ke atas umumnya mulai menimbulkan kerusakan.",
        tags: ["gempa", "skala Richter", "seismologi"],
        status: "PUBLISHED" as const,
        weight: 1,
        answerKeys: [{ key: "5", tolerance: 0 }],
        rubric: null,
        options: [],
    },
    // --- ESSAY ---
    {
        content:
            "Jelaskan proses siklus batuan (rock cycle) dari batuan beku hingga kembali menjadi magma. Uraikan minimal 3 tahap utama beserta kondisi yang diperlukan.",
        type: "ESSAY" as const,
        topic: "Geology",
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
            {
                component: "Batuan beku → pelapukan/erosi",
                keywords: ["pelapukan", "erosi", "pelapukan mekanik", "kimia"],
                points: 1,
            },
            {
                component: "Sedimen → batuan sedimen",
                keywords: ["kompaksi", "sementasi", "litifikasi", "diagenesis"],
                points: 1,
            },
            {
                component: "Batuan sedimen/metamorf → magma",
                keywords: ["metamorfisme", "lebur", "mencair", "zona subduksi", "panas"],
                points: 1,
            },
        ],
        options: [],
    },
];

const SEED_MATERIALS = [
    {
        title: "Pengantar Geologi: Batuan dan Mineral",
        description: "Materi dasar tentang jenis batuan (beku, sedimen, metamorf) dan mineral penyusun kerak bumi.",
        type: "PDF" as const,
        url: "https://example.com/materi/geologi-batuan-mineral.pdf",
        topic: "Geology",
        tags: ["geologi", "batuan", "mineral", "dasar"],
        status: "PUBLISHED" as const,
    },
    {
        title: "Struktur Lapisan Bumi",
        description: "Video singkat menjelaskan lapisan-lapisan bumi: kerak, mantel, inti luar, inti dalam.",
        type: "VIDEO" as const,
        url: "https://www.youtube.com/watch?v=dummy-struktur-bumi",
        topic: "Geology",
        tags: ["struktur bumi", "kerak", "mantel", "inti"],
        status: "PUBLISHED" as const,
    },
    {
        title: "Siklus Batuan (Rock Cycle)",
        description: "Slide presentasi siklus batuan: magma → batuan beku → sedimen → batuan sedimen/metamorf → magma.",
        type: "SLIDE" as const,
        url: "https://example.com/slide/siklus-batuan.pdf",
        topic: "Geology",
        tags: ["siklus batuan", "petrologi"],
        status: "PUBLISHED" as const,
    },
    {
        title: "Lapisan Atmosfer dan Cuaca",
        description: "Teori lapisan atmosfer (troposfer, stratosfer, mesosfer, termosfer) dan kaitannya dengan cuaca.",
        type: "TEXT" as const,
        url: "https://example.com/materi/atmosfer-cuaca",
        topic: "Meteorology",
        tags: ["atmosfer", "cuaca", "iklim"],
        status: "PUBLISHED" as const,
    },
    {
        title: "Pengenalan Tata Surya",
        description: "Materi pengenalan planet-planet, satelit, dan objek kecil di tata surya.",
        type: "PDF" as const,
        url: "https://example.com/materi/tata-surya.pdf",
        topic: "Astronomy",
        tags: ["tata surya", "planet", "astronomi"],
        status: "PUBLISHED" as const,
    },
    {
        title: "Arus Laut dan Sirkulasi Samudra",
        description: "Video tentang arus laut global dan peran samudra dalam iklim.",
        type: "VIDEO" as const,
        url: "https://www.youtube.com/watch?v=dummy-arus-laut",
        topic: "Oceanography",
        tags: ["arus laut", "sirkulasi", "samudra"],
        status: "PUBLISHED" as const,
    },
];

async function getDb() {
    const connection = await mysql.createPool({ uri: process.env.DATABASE_URL });
    return { db: drizzle(connection, { schema, mode: "default" }), connection };
}

async function main() {
    const { db, connection } = await getDb();
    console.log("🌱 Seed: topics, questions, materials\n");

    // --- Topics ---
    console.log("📁 Topics");
    for (const t of TOPICS) {
        try {
            const existing = await db.query.topics.findFirst({ where: eq(topics.name, t.name) });
            if (!existing) {
                await db.insert(topics).values(t);
                console.log(`  ✓ ${t.name}`);
            } else {
                console.log(`  - ${t.name} (sudah ada)`);
            }
        } catch (e) {
            console.warn(`  ⚠ ${t.name}:`, (e as Error).message);
        }
    }

    // --- Questions + options ---
    console.log("\n📝 Questions");
    let questionsAdded = 0;
    for (const q of SEED_QUESTIONS) {
        const { options: opts, ...questionData } = q;
        const data = {
            ...questionData,
            createdBy: null,
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
        questionsAdded++;
        console.log(`  ✓ [${questionData.type}] ${questionData.content.substring(0, 45)}...`);
    }
    console.log(`  Total: ${questionsAdded} soal.`);

    // --- Materials ---
    console.log("\n📚 Materials");
    for (const m of SEED_MATERIALS) {
        try {
            const existing = await db.query.materials.findFirst({
                where: eq(materials.title, m.title),
            });
            if (!existing) {
                await db.insert(materials).values({
                    ...m,
                    tags: m.tags ?? null,
                });
                console.log(`  ✓ ${m.title}`);
            } else {
                console.log(`  - ${m.title} (sudah ada)`);
            }
        } catch (e) {
            console.warn(`  ⚠ ${m.title}:`, (e as Error).message);
        }
    }

    await connection.end();
    console.log("\n✅ Seed selesai.");
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed gagal:", err);
        process.exit(1);
    });
