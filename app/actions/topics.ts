"use server";

import { db } from "@/lib/db";
import { topics } from "@/lib/schema";
import { eq, asc, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { normalizeTopic } from "@/lib/utils";

export interface TopicRecord {
    id: number;
    name: string;
    sortOrder: number | null;
}

export async function getTopics(): Promise<TopicRecord[]> {
    try {
        const rows = await db.select().from(topics).orderBy(asc(topics.sortOrder), asc(topics.name));
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            sortOrder: r.sortOrder,
        }));
    } catch (error) {
        console.error("getTopics failed:", error);
        return [];
    }
}

export async function createTopic(name: string): Promise<{ success: boolean; message?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const normalized = normalizeTopic(name.trim());
    if (!normalized) return { success: false, message: "Nama topik tidak boleh kosong" };

    try {
        const existing = await db.query.topics.findFirst({ where: eq(topics.name, normalized) });
        if (existing) return { success: false, message: `Topik "${normalized}" sudah ada` };

        const [maxRow] = await db
            .select({ maxOrder: sql<number>`COALESCE(MAX(${topics.sortOrder}), 0)` })
            .from(topics);
        const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

        await db.insert(topics).values({ name: normalized, sortOrder: nextOrder });
        revalidatePath("/dashboard/bank-soal");
        return { success: true };
    } catch (error) {
        console.error("createTopic failed:", error);
        return { success: false, message: "Gagal menambah topik" };
    }
}

export async function updateTopic(id: number, name: string): Promise<{ success: boolean; message?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const normalized = normalizeTopic(name.trim());
    if (!normalized) return { success: false, message: "Nama topik tidak boleh kosong" };

    try {
        const existing = await db.query.topics.findFirst({ where: eq(topics.name, normalized) });
        if (existing && existing.id !== id) return { success: false, message: `Topik "${normalized}" sudah ada` };

        await db.update(topics).set({ name: normalized }).where(eq(topics.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true };
    } catch (error) {
        console.error("updateTopic failed:", error);
        return { success: false, message: "Gagal mengubah topik" };
    }
}

export async function deleteTopic(id: number): Promise<{ success: boolean; message?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        await db.delete(topics).where(eq(topics.id, id));
        revalidatePath("/dashboard/bank-soal");
        return { success: true };
    } catch (error) {
        console.error("deleteTopic failed:", error);
        return { success: false, message: "Gagal menghapus topik" };
    }
}
