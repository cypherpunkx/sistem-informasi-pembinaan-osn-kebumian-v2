/**
 * Seed data default untuk situs publik (hero, nav cards, statistik).
 * Jalankan: npx tsx scripts/seed-public-site.ts
 * Memerlukan DATABASE_URL di .env. Jalankan setelah migration 0005.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../lib/schema";
import { siteSettings, navCards, publicStats } from "../lib/schema";

const HERO = [
    { key: "hero_badge", value: "Resmi" },
    { key: "hero_title", value: "Portal Pembinaan OSN Kebumian" },
    { key: "hero_description", value: "Sumber informasi dan persiapan resmi Olimpiade Sains Nasional bidang Kebumian." },
    { key: "hero_cta_text", value: "Lihat Persiapan" },
    { key: "hero_cta_url", value: "/persiapan" },
];

const NAV_CARDS = [
    { title: "Persiapan", description: "Panduan dan materi persiapan OSN Kebumian.", href: "/persiapan", icon: "BookOpen", sortOrder: 1 },
    { title: "Silabus", description: "Ruang lingkup materi dan topik yang diujikan.", href: "/silabus", icon: "BookMarked", sortOrder: 2 },
    { title: "Arsip Soal", description: "Kumpulan soal OSN tahun sebelumnya.", href: "/arsip-soal", icon: "Archive", sortOrder: 3 },
    { title: "Statistik", description: "Data peserta, provinsi, dan rekap tahunan.", href: "/statistik", icon: "BarChart3", sortOrder: 4 },
    { title: "Tentang OSN", description: "Informasi umum tentang OSN Kebumian.", href: "/tentang", icon: "Trophy", sortOrder: 5 },
    { title: "News & Pengumuman", description: "Update resmi dan pengumuman terbaru.", href: "/news", icon: "Newspaper", sortOrder: 6 },
];

const STATS = [
    { key: "provinsi", value: "38", label: "Provinsi", sortOrder: 1 },
    { key: "peserta", value: "12.000+", label: "Peserta", sortOrder: 2 },
    { key: "tahun", value: "20+", label: "Tahun Penyelenggaraan", sortOrder: 3 },
    { key: "arsip", value: "500+", label: "Arsip Soal", sortOrder: 4 },
];

async function seed() {
    const connection = await mysql.createPool({ uri: process.env.DATABASE_URL });
    const db = drizzle(connection, { schema, mode: "default" });

    console.log("Seeding site_settings...");
    for (const row of HERO) {
        try {
            await db.insert(siteSettings).values(row).onDuplicateKeyUpdate({ set: { value: row.value } });
            console.log("  ✓", row.key);
        } catch (e) {
            console.warn("  ⚠", row.key, (e as Error).message);
        }
    }

    console.log("Seeding nav_cards...");
    const existingNav = await db.select({ id: navCards.id }).from(navCards);
    if (existingNav.length === 0) {
        for (const row of NAV_CARDS) {
            await db.insert(navCards).values(row);
            console.log("  ✓", row.title);
        }
    } else {
        console.log("  - nav_cards already has rows, skip");
    }

    console.log("Seeding public_stats...");
    for (const row of STATS) {
        try {
            await db.insert(publicStats).values(row).onDuplicateKeyUpdate({
                set: { value: row.value, label: row.label, sortOrder: row.sortOrder },
            });
            console.log("  ✓", row.key);
        } catch (e) {
            console.warn("  ⚠", row.key, (e as Error).message);
        }
    }

    await connection.end();
    console.log("Done.");
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
