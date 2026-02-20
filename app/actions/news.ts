"use server";

import { db } from "@/lib/db";
import { news, newsViews } from "@/lib/schema";
import { eq, and, sql, desc, like } from "drizzle-orm";
import type { NewsCategorySlug } from "@/lib/news-categories";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export interface NewsFilters {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface NewsListItem {
    id: number;
    title: string;
    slug: string;
    category: string | null;
    thumbnailUrl: string | null;
    summary: string | null;
    status: "DRAFT" | "PUBLISHED";
    publishedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface GetNewsListResult {
    data: NewsListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface NewsCounts {
    total: number;
    published: number;
    draft: number;
    views30d: number;
}

export async function getNewsCounts(): Promise<NewsCounts> {
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(news);
    const [publishedRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(eq(news.status, "PUBLISHED"));
    const [draftRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(eq(news.status, "DRAFT"));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [viewsRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsViews)
        .where(sql`${newsViews.viewedAt} >= ${thirtyDaysAgo}`);

    return {
        total: Number(totalRow?.count ?? 0),
        published: Number(publishedRow?.count ?? 0),
        draft: Number(draftRow?.count ?? 0),
        views30d: Number(viewsRow?.count ?? 0),
    };
}

export async function getNewsList(filters: NewsFilters = {}): Promise<GetNewsListResult> {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "admin" && role !== "pembina") {
        return { data: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 };
    }

    const { search, status, page = 1, limit: rawLimit = DEFAULT_PAGE_SIZE } = filters;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit));

    const conditions = [];
    if (search?.trim()) {
        conditions.push(like(news.title, `%${search.trim()}%`));
    }
    if (status && status !== "All") {
        conditions.push(eq(news.status, status as "DRAFT" | "PUBLISHED"));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(news)
        .where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (Math.max(1, page) - 1) * limit;

    const data = await db
        .select({
            id: news.id,
            title: news.title,
            slug: news.slug,
            category: news.category,
            thumbnailUrl: news.thumbnailUrl,
            summary: news.summary,
            status: news.status,
            publishedAt: news.publishedAt,
            createdAt: news.createdAt,
            updatedAt: news.updatedAt,
        })
        .from(news)
        .where(whereClause)
        .orderBy(desc(news.updatedAt))
        .limit(limit)
        .offset(offset);

    return { data, total, page: Math.max(1, page), limit, totalPages };
}

export async function getNewsById(id: number) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return null;
    }
    const [row] = await db.select().from(news).where(eq(news.id, id));
    return row ?? null;
}

export async function getNewsBySlug(slug: string) {
    const [row] = await db.select().from(news).where(eq(news.slug, slug));
    if (!row || row.status !== "PUBLISHED") return null;
    return row;
}

/** Cek apakah slug tersedia (untuk validasi real-time). excludeId = id artikel saat edit. */
export async function checkNewsSlugAvailable(slug: string, excludeId?: number): Promise<boolean> {
    const s = (slug || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!s) return false;
    const conditions = [eq(news.slug, s)];
    if (excludeId != null && excludeId > 0) {
        conditions.push(sql`${news.id} != ${excludeId}`);
    }
    const [row] = await db
        .select({ id: news.id })
        .from(news)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0]);
    return !row;
}

export async function createNews(formData: FormData): Promise<{ success: boolean; message: string; id?: number }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }

    const title = formData.get("title") as string;
    const slug = (formData.get("slug") as string)?.trim()?.toLowerCase().replace(/\s+/g, "-") || "";
    const thumbnailUrl = (formData.get("thumbnailUrl") as string) || null;
    const summary = (formData.get("summary") as string) || null;
    const content = (formData.get("content") as string) || null;
    const status = (formData.get("status") as "DRAFT" | "PUBLISHED") || "DRAFT";
    const category = (formData.get("category") as NewsCategorySlug | string) || null;
    const seoTitle = (formData.get("seoTitle") as string) || null;
    const seoDescription = (formData.get("seoDescription") as string) || null;

    if (!title?.trim()) return { success: false, message: "Judul wajib diisi." };
    if (!slug) return { success: false, message: "Slug wajib diisi." };

    const userId = session.user?.id ? parseInt(session.user.id, 10) : undefined;
    const validUserId = userId && !Number.isNaN(userId) ? userId : undefined;
    const validCategory = category && ["pengumuman", "jadwal", "hasil", "materi", "info_teknis", "dokumentasi"].includes(category) ? category : null;

    try {
        const [inserted] = await db
            .insert(news)
            .values({
                title: title.trim(),
                slug,
                category: validCategory,
                thumbnailUrl: thumbnailUrl || null,
                summary: summary || null,
                content: content || null,
                status,
                publishedAt: status === "PUBLISHED" ? new Date() : null,
                seoTitle: seoTitle || null,
                seoDescription: seoDescription || null,
                createdBy: validUserId ?? undefined,
            })
            .$returningId();
        revalidatePath("/dashboard/news");
        revalidatePath("/news");
        return { success: true, message: "Artikel berhasil dibuat.", id: inserted?.id };
    } catch (e) {
        console.error("createNews error:", e);
        return { success: false, message: "Gagal membuat artikel. Slug mungkin sudah dipakai." };
    }
}

export async function updateNews(id: number, formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }

    const title = formData.get("title") as string;
    const slug = (formData.get("slug") as string)?.trim()?.toLowerCase().replace(/\s+/g, "-") || "";
    const thumbnailUrl = (formData.get("thumbnailUrl") as string) || null;
    const summary = (formData.get("summary") as string) || null;
    const content = (formData.get("content") as string) || null;
    const status = (formData.get("status") as "DRAFT" | "PUBLISHED") || "DRAFT";
    const category = (formData.get("category") as NewsCategorySlug | string) || null;
    const seoTitle = (formData.get("seoTitle") as string) || null;
    const seoDescription = (formData.get("seoDescription") as string) || null;

    if (!title?.trim()) return { success: false, message: "Judul wajib diisi." };
    if (!slug) return { success: false, message: "Slug wajib diisi." };

    const validCategory = category && ["pengumuman", "jadwal", "hasil", "materi", "info_teknis", "dokumentasi"].includes(category) ? category : null;

    try {
        const [existing] = await db.select({ publishedAt: news.publishedAt }).from(news).where(eq(news.id, id));
        if (!existing) return { success: false, message: "Artikel tidak ditemukan." };

        await db
            .update(news)
            .set({
                title: title.trim(),
                slug,
                category: validCategory,
                thumbnailUrl: thumbnailUrl || null,
                summary: summary || null,
                content: content || null,
                status,
                publishedAt: status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
                seoTitle: seoTitle || null,
                seoDescription: seoDescription || null,
            })
            .where(eq(news.id, id));
        revalidatePath("/dashboard/news");
        revalidatePath("/news");
        revalidatePath(`/news/${slug}`);
        return { success: true, message: "Artikel berhasil diperbarui." };
    } catch (e) {
        console.error("updateNews error:", e);
        return { success: false, message: "Gagal memperbarui artikel. Slug mungkin sudah dipakai." };
    }
}

export async function toggleNewsPublish(idOrFormData: number | FormData): Promise<{ success: boolean; message: string }> {
    const id = typeof idOrFormData === "number"
        ? idOrFormData
        : parseInt(String(idOrFormData.get("id")), 10);
    if (Number.isNaN(id) || id < 1) return { success: false, message: "ID tidak valid." };
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }

    const [row] = await db.select({ status: news.status, publishedAt: news.publishedAt }).from(news).where(eq(news.id, id));
    if (!row) return { success: false, message: "Artikel tidak ditemukan." };

    const nextStatus = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const publishedAt = nextStatus === "PUBLISHED" ? (row.publishedAt ?? new Date()) : row.publishedAt;

    await db.update(news).set({ status: nextStatus, publishedAt }).where(eq(news.id, id));
    revalidatePath("/dashboard/news");
    revalidatePath("/news");
    return { success: true, message: nextStatus === "PUBLISHED" ? "Artikel dipublikasi." : "Artikel di-unpublish." };
}

/** Wrapper for use as form action; returns void as required by React form action type. */
export async function toggleNewsPublishFormAction(formData: FormData): Promise<void> {
    await toggleNewsPublish(formData);
}

export async function deleteNews(id: number): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await db.delete(newsViews).where(eq(newsViews.newsId, id));
        await db.delete(news).where(eq(news.id, id));
        revalidatePath("/dashboard/news");
        revalidatePath("/news");
        return { success: true, message: "Artikel dihapus." };
    } catch (e) {
        console.error("deleteNews error:", e);
        return { success: false, message: "Gagal menghapus artikel." };
    }
}

export async function incrementNewsView(newsId: number): Promise<void> {
    try {
        await db.insert(newsViews).values({ newsId });
    } catch (e) {
        console.error("incrementNewsView error:", e);
    }
}

export type NewsCategoryFilter = NewsCategorySlug | "";

export interface GetNewsPublicResult {
    data: Array<{
        id: number;
        title: string;
        slug: string;
        category: string | null;
        thumbnailUrl: string | null;
        summary: string | null;
        publishedAt: Date | null;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const VALID_CATEGORIES = ["pengumuman", "jadwal", "hasil", "materi", "info_teknis", "dokumentasi"] as const;

/** Tahun-tahun yang punya artikel published (untuk dropdown arsip). */
export async function getNewsYears(): Promise<number[]> {
    const rows = await db
        .select({ publishedAt: news.publishedAt })
        .from(news)
        .where(and(eq(news.status, "PUBLISHED"), sql`${news.publishedAt} IS NOT NULL`));
    const years = [...new Set(rows.map((r) => new Date(r.publishedAt!).getFullYear()))].sort((a, b) => b - a);
    return years;
}

export async function getNewsPublic(filters: {
    page?: number;
    limit?: number;
    category?: NewsCategoryFilter | string | null;
    year?: number | null;
} = {}): Promise<GetNewsPublicResult> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(20, Math.max(1, filters.limit ?? 12));
    const cat = filters.category?.trim();
    const filterByCategory = cat && VALID_CATEGORIES.includes(cat as (typeof VALID_CATEGORIES)[number]);
    const filterYear = typeof filters.year === "number" && filters.year > 0 ? filters.year : null;

    const conditions = [eq(news.status, "PUBLISHED")];
    if (filterByCategory) conditions.push(eq(news.category, cat));
    if (filterYear) conditions.push(sql`YEAR(${news.publishedAt}) = ${filterYear}`);
    const whereClause = and(...conditions);

    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(news).where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const data = await db
        .select({
            id: news.id,
            title: news.title,
            slug: news.slug,
            category: news.category,
            thumbnailUrl: news.thumbnailUrl,
            summary: news.summary,
            publishedAt: news.publishedAt,
        })
        .from(news)
        .where(whereClause)
        .orderBy(desc(news.publishedAt))
        .limit(limit)
        .offset(offset);

    return { data, total, page, limit, totalPages };
}
