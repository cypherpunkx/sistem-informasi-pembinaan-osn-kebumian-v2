/**
 * Seed script: memastikan minimal satu user admin tersedia.
 *
 * Jalankan:
 *   npx tsx scripts/seed-admin.ts
 * atau:
 *   npm run db:seed:admin
 *
 * Membutuhkan:
 *   - DATABASE_URL
 *   - ADMIN_EMAIL
 *   - ADMIN_PASSWORD
 *   - ADMIN_NAME (opsional, default: "Administrator")
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { users } from "../lib/schema";
import { hash } from "bcryptjs";

async function getDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }
    const connection = await mysql.createPool({ uri: process.env.DATABASE_URL });
    const db = drizzle(connection);
    return { db, connection };
}

async function main() {
    const { db, connection } = await getDb();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Administrator";

    if (!adminEmail || !adminPassword) {
        throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD harus di-set di environment untuk membuat admin.");
    }

    console.log("🔐 Seed admin user\n");

    // Cek apakah sudah ada admin
    const existingAdmins = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.role, "admin"));

    if (existingAdmins.length > 0) {
        console.log(`  - Admin sudah ada (${existingAdmins.length} user). Tidak membuat admin baru.`);
        await connection.end();
        return;
    }

    // Jika belum ada admin sama sekali, buat admin baru
    const passwordHash = await hash(adminPassword, 10);

    await db.insert(users).values({
        name: adminName,
        email: adminEmail,
        password: passwordHash,
        role: "admin",
        school: null,
        contact: null,
        competitionCategory: null,
    });

    console.log("  ✓ Admin user berhasil dibuat:");
    console.log(`    - email: ${adminEmail}`);
    console.log(`    - name : ${adminName}`);

    await connection.end();
    console.log("\n✅ Seed admin selesai.");
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Seed admin gagal:", err);
        process.exit(1);
    });

