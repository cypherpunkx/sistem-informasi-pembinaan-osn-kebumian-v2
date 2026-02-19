/**
 * Seed script untuk topik default OSN Kebumian.
 * Jalankan: npx tsx scripts/seed-topics.ts
 * atau: npm run db:seed:topics
 *
 * Memerlukan DATABASE_URL di .env
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import * as schema from "../lib/schema";
import { topics } from "../lib/schema";

const DEFAULT_TOPICS = [
    { name: "Geology", sortOrder: 1 },
    { name: "Meteorology", sortOrder: 2 },
    { name: "Astronomy", sortOrder: 3 },
    { name: "Oceanography", sortOrder: 4 },
];

async function seedTopics() {
    const connection = await mysql.createPool({ uri: process.env.DATABASE_URL });
    const db = drizzle(connection, { schema, mode: "default" });

    for (const t of DEFAULT_TOPICS) {
        try {
            const existing = await db.query.topics.findFirst({ where: eq(topics.name, t.name) });
            if (!existing) {
                await db.insert(topics).values(t);
                console.log(`  ✓ Topic: ${t.name}`);
            } else {
                console.log(`  - Topic ${t.name} already exists`);
            }
        } catch (e) {
            console.warn(`  ⚠ Topic ${t.name}:`, (e as Error).message);
        }
    }

    await connection.end();
    console.log("Done seeding topics.");
}

seedTopics().catch(console.error);
