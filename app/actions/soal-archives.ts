"use server";

import { db } from "@/lib/db";
import { soalArchives } from "@/lib/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export interface ArsipSoalItem {
    id: number;
    tahun: number;
    tahap: string;
    jenjang: string;
    title: string | null;
    soalUrl: string;
    pembahasanUrl: string | null;
}

export interface GetArsipSoalPublicResult {
    data: ArsipSoalItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Public: list arsip soal dengan filter. */
export async function getArsipSoalPublic(filters: {
    page?: number;
    limit?: number;
    tahun?: number | null;
    tahap?: string | null;
    jenjang?: string | null;
} = {}): Promise<GetArsipSoalPublicResult> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 12));
    const conditions = [];
    if (filters.tahun != null && filters.tahun > 0) {
        conditions.push(eq(soalArchives.tahun, filters.tahun));
    }
    if (filters.tahap?.trim()) {
        conditions.push(eq(soalArchives.tahap, filters.tahap.trim()));
    }
    if (filters.jenjang?.trim()) {
        conditions.push(eq(soalArchives.jenjang, filters.jenjang.trim()));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(soalArchives).where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const data = await db
        .select({
            id: soalArchives.id,
            tahun: soalArchives.tahun,
            tahap: soalArchives.tahap,
            jenjang: soalArchives.jenjang,
            title: soalArchives.title,
            soalUrl: soalArchives.soalUrl,
            pembahasanUrl: soalArchives.pembahasanUrl,
        })
        .from(soalArchives)
        .where(whereClause)
        .orderBy(desc(soalArchives.tahun), desc(soalArchives.id))
        .limit(limit)
        .offset(offset);

    return { data, total, page, limit, totalPages };
}

/** Public: daftar tahun yang punya arsip. */
export async function getArsipSoalYears(): Promise<number[]> {
    const rows = await db.selectDistinct({ tahun: soalArchives.tahun }).from(soalArchives).orderBy(desc(soalArchives.tahun));
    return rows.map((r) => r.tahun);
}

/** Public: opsi tahap (distinct). */
export async function getArsipSoalTahapOptions(): Promise<string[]> {
    const rows = await db.selectDistinct({ tahap: soalArchives.tahap }).from(soalArchives);
    return rows.map((r) => r.tahap).filter(Boolean);
}

/** Public: opsi jenjang (distinct). */
export async function getArsipSoalJenjangOptions(): Promise<string[]> {
    const rows = await db.selectDistinct({ jenjang: soalArchives.jenjang }).from(soalArchives);
    return rows.map((r) => r.jenjang).filter(Boolean);
}

/** Admin: list arsip (untuk dashboard). */
export async function getArsipSoalForAdmin(filters: { page?: number; limit?: number } = {}) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 10));
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(soalArchives);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const data = await db.select().from(soalArchives).orderBy(desc(soalArchives.tahun), desc(soalArchives.id)).limit(limit).offset(offset);
    return { data, total, page, limit, totalPages };
}

/** Admin: create arsip. */
export async function createSoalArchive(formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const tahun = parseInt(String(formData.get("tahun")), 10);
    const tahap = (formData.get("tahap") as string)?.trim();
    const jenjang = (formData.get("jenjang") as string)?.trim();
    const soalUrl = (formData.get("soalUrl") as string)?.trim();
    if (Number.isNaN(tahun) || !tahap || !jenjang || !soalUrl) {
        return { success: false, message: "Tahun, tahap, jenjang, dan URL soal wajib." };
    }
    try {
        await db.insert(soalArchives).values({
            tahun,
            tahap,
            jenjang,
            title: (formData.get("title") as string) || null,
            soalUrl,
            pembahasanUrl: (formData.get("pembahasanUrl") as string) || null,
            publishedAt: new Date(),
        });
        revalidatePath("/arsip-soal");
        revalidatePath("/");
        return { success: true, message: "Arsip soal ditambah." };
    } catch (e) {
        console.error("createSoalArchive error:", e);
        return { success: false, message: "Gagal menambah." };
    }
}

/** Admin: update arsip dari form (formData.get("id")). */
export async function updateSoalArchiveFromForm(formData: FormData): Promise<{ success: boolean; message: string }> {
    const id = parseInt(String(formData.get("id")), 10);
    if (Number.isNaN(id) || id < 1) return { success: false, message: "ID tidak valid." };
    return updateSoalArchive(id, formData);
}

/** Admin: update arsip. */
export async function updateSoalArchive(id: number, formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const tahun = parseInt(String(formData.get("tahun")), 10);
    const tahap = (formData.get("tahap") as string)?.trim();
    const jenjang = (formData.get("jenjang") as string)?.trim();
    const soalUrl = (formData.get("soalUrl") as string)?.trim();
    if (Number.isNaN(tahun) || !tahap || !jenjang || !soalUrl) {
        return { success: false, message: "Tahun, tahap, jenjang, dan URL soal wajib." };
    }
    try {
        await db.update(soalArchives).set({
            tahun,
            tahap,
            jenjang,
            title: (formData.get("title") as string) || null,
            soalUrl,
            pembahasanUrl: (formData.get("pembahasanUrl") as string) || null,
        }).where(eq(soalArchives.id, id));
        revalidatePath("/arsip-soal");
        return { success: true, message: "Arsip soal diperbarui." };
    } catch (e) {
        console.error("updateSoalArchive error:", e);
        return { success: false, message: "Gagal memperbarui." };
    }
}

/** Admin: delete arsip dari form (formData.get("id")). */
export async function deleteSoalArchiveFromForm(formData: FormData): Promise<{ success: boolean; message: string }> {
    const id = parseInt(String(formData.get("id")), 10);
    if (Number.isNaN(id) || id < 1) return { success: false, message: "ID tidak valid." };
    return deleteSoalArchive(id);
}

/** Admin: delete arsip. */
export async function deleteSoalArchive(id: number): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    try {
        await db.delete(soalArchives).where(eq(soalArchives.id, id));
        revalidatePath("/arsip-soal");
        return { success: true, message: "Arsip soal dihapus." };
    } catch (e) {
        console.error("deleteSoalArchive error:", e);
        return { success: false, message: "Gagal menghapus." };
    }
}
