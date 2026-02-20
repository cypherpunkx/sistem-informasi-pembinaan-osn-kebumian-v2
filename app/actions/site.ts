"use server";

import { db } from "@/lib/db";
import { siteSettings, navCards, publicStats } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const HERO_KEYS = ["hero_badge", "hero_title", "hero_description", "hero_cta_text", "hero_cta_url"] as const;

export interface HomepageHero {
    badge: string;
    title: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
}

/** Public: baca hero beranda (dengan fallback default). */
export async function getHomepageHero(): Promise<HomepageHero> {
    const map = new Map<string, string>();
    const all = await db.select().from(siteSettings);
    all.forEach((r) => map.set(r.key, r.value ?? ""));
    return {
        badge: map.get("hero_badge") ?? "Resmi",
        title: map.get("hero_title") ?? "Portal Pembinaan OSN Kebumian",
        description: map.get("hero_description") ?? "Sumber informasi dan persiapan resmi Olimpiade Sains Nasional bidang Kebumian.",
        ctaText: map.get("hero_cta_text") ?? "Lihat Persiapan",
        ctaUrl: map.get("hero_cta_url") ?? "/persiapan",
    };
}

/** Public: daftar nav cards aktif, terurut. */
export async function getNavCardsPublic(): Promise<{ id: number; title: string; description: string | null; href: string; icon: string }[]> {
    const rows = await db
        .select({ id: navCards.id, title: navCards.title, description: navCards.description, href: navCards.href, icon: navCards.icon })
        .from(navCards)
        .where(eq(navCards.isActive, true))
        .orderBy(asc(navCards.sortOrder));
    return rows;
}

/** Public: statistik untuk beranda & halaman statistik. */
export interface PublicStatItem {
    key: string;
    value: string;
    label: string;
}

export async function getPublicStats(): Promise<PublicStatItem[]> {
    const rows = await db.select().from(publicStats).orderBy(asc(publicStats.sortOrder));
    return rows.map((r) => ({ key: r.key, value: r.value, label: r.label }));
}

/** Admin: simpan semua hero (dari form). */
export async function setHomepageHero(formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const keys: { key: (typeof HERO_KEYS)[number]; value: string }[] = HERO_KEYS.map((key) => ({
        key,
        value: String(formData.get(key) ?? ""),
    }));
    try {
        for (const { key, value } of keys) {
            await db.insert(siteSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
        }
        revalidatePath("/");
        return { success: true, message: "Hero beranda tersimpan." };
    } catch (e) {
        console.error("setHomepageHero error:", e);
        return { success: false, message: "Gagal menyimpan." };
    }
}

/** Admin: simpan satu site setting. */
export async function setSiteSetting(key: string, value: string): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    try {
        await db.insert(siteSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
        revalidatePath("/");
        revalidatePath("/statistik");
        return { success: true, message: "Tersimpan." };
    } catch (e) {
        console.error("setSiteSetting error:", e);
        return { success: false, message: "Gagal menyimpan." };
    }
}

/** Admin: dapatkan semua site settings (untuk form). */
export async function getSiteSettingsForAdmin(): Promise<Record<string, string>> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") return {};
    const rows = await db.select().from(siteSettings);
    const out: Record<string, string> = {};
    rows.forEach((r) => (out[r.key] = r.value ?? ""));
    return out;
}

/** Admin: list nav cards. */
export async function getNavCardsForAdmin(): Promise<{ id: number; title: string; description: string | null; href: string; icon: string; sortOrder: number | null; isActive: boolean | null }[]> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") return [];
    return db.select().from(navCards).orderBy(asc(navCards.sortOrder));
}

/** Admin: create nav card. */
export async function createNavCard(formData: FormData): Promise<{ success: boolean; message: string; id?: number }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const title = (formData.get("title") as string)?.trim();
    const href = (formData.get("href") as string)?.trim() || "#";
    const icon = (formData.get("icon") as string)?.trim() || "Circle";
    if (!title) return { success: false, message: "Judul wajib." };
    try {
        const [r] = await db.insert(navCards).values({
            title,
            description: (formData.get("description") as string) || null,
            href,
            icon,
            sortOrder: parseInt(String(formData.get("sortOrder")), 10) || 0,
            isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
        }).$returningId();
        revalidatePath("/");
        return { success: true, message: "Card ditambah.", id: r?.id };
    } catch (e) {
        console.error("createNavCard error:", e);
        return { success: false, message: "Gagal menambah." };
    }
}

/** Admin: update nav card dari form (formData.get("id")). */
export async function updateNavCardFromForm(formData: FormData): Promise<{ success: boolean; message: string }> {
    const id = parseInt(String(formData.get("id")), 10);
    if (Number.isNaN(id) || id < 1) return { success: false, message: "ID tidak valid." };
    return updateNavCard(id, formData);
}

/** Wrapper for use as form action; returns void as required by React form action type. */
export async function updateNavCardFromFormFormAction(formData: FormData): Promise<void> {
    await updateNavCardFromForm(formData);
}

/** Admin: update nav card. */
export async function updateNavCard(id: number, formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, message: "Judul wajib." };
    try {
        await db.update(navCards).set({
            title,
            description: (formData.get("description") as string) || null,
            href: (formData.get("href") as string)?.trim() || "#",
            icon: (formData.get("icon") as string)?.trim() || "Circle",
            sortOrder: parseInt(String(formData.get("sortOrder")), 10) || 0,
            isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
        }).where(eq(navCards.id, id));
        revalidatePath("/");
        return { success: true, message: "Card diperbarui." };
    } catch (e) {
        console.error("updateNavCard error:", e);
        return { success: false, message: "Gagal memperbarui." };
    }
}

/** Admin: delete nav card. */
export async function deleteNavCard(id: number): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    try {
        await db.delete(navCards).where(eq(navCards.id, id));
        revalidatePath("/");
        return { success: true, message: "Card dihapus." };
    } catch (e) {
        console.error("deleteNavCard error:", e);
        return { success: false, message: "Gagal menghapus." };
    }
}

/** Admin: delete nav card dari form (formData.get("id")). */
export async function deleteNavCardFromForm(formData: FormData): Promise<{ success: boolean; message: string }> {
    const id = parseInt(String(formData.get("id")), 10);
    if (Number.isNaN(id) || id < 1) return { success: false, message: "ID tidak valid." };
    return deleteNavCard(id);
}

/** Admin: list public stats. */
export async function getPublicStatsForAdmin(): Promise<PublicStatItem[]> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") return [];
    const rows = await db.select().from(publicStats).orderBy(asc(publicStats.sortOrder));
    return rows.map((r) => ({ key: r.key, value: r.value, label: r.label }));
}

/** Admin: set public stat dari form. */
export async function setPublicStatFromForm(formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const key = (formData.get("key") as string)?.trim();
    const value = (formData.get("value") as string)?.trim() ?? "";
    const label = (formData.get("label") as string)?.trim() ?? "";
    const sortOrder = parseInt(String(formData.get("sortOrder")), 10);
    if (!key) return { success: false, message: "Key wajib." };
    return setPublicStat(key, value, label, Number.isNaN(sortOrder) ? undefined : sortOrder);
}

/** Admin: set public stat (upsert). */
export async function setPublicStat(key: string, value: string, label: string, sortOrder?: number): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    try {
        await db.insert(publicStats).values({
            key,
            value,
            label,
            sortOrder: sortOrder ?? 0,
        }).onDuplicateKeyUpdate({
            set: { value, label, sortOrder: sortOrder ?? 0 },
        });
        revalidatePath("/");
        revalidatePath("/statistik");
        return { success: true, message: "Statistik tersimpan." };
    } catch (e) {
        console.error("setPublicStat error:", e);
        return { success: false, message: "Gagal menyimpan." };
    }
}
