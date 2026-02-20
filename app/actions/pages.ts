"use server";

import { db } from "@/lib/db";
import { pages, pageSections } from "@/lib/schema";
import { eq, asc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export interface PageSection {
    id: number;
    sectionKey: string;
    title: string;
    content: string | null;
    sortOrder: number | null;
}

/** Public: halaman single-content (e.g. tentang). */
export async function getPageBySlug(slug: string): Promise<{ id: number; title: string; description: string | null; content: string | null } | null> {
    const [row] = await db
        .select({ id: pages.id, title: pages.title, description: pages.description, content: pages.content })
        .from(pages)
        .where(eq(pages.slug, slug));
    return row ?? null;
}

/** Public: halaman dengan sections (e.g. persiapan, silabus). */
export async function getPageWithSections(slug: string): Promise<{
    page: { id: number; title: string; description: string | null; template: string | null };
    sections: PageSection[];
} | null> {
    const [pageRow] = await db.select().from(pages).where(eq(pages.slug, slug));
    if (!pageRow) return null;
    const sections = await db
        .select({
            id: pageSections.id,
            sectionKey: pageSections.sectionKey,
            title: pageSections.title,
            content: pageSections.content,
            sortOrder: pageSections.sortOrder,
        })
        .from(pageSections)
        .where(eq(pageSections.pageId, pageRow.id))
        .orderBy(asc(pageSections.sortOrder));
    return {
        page: {
            id: pageRow.id,
            title: pageRow.title,
            description: pageRow.description,
            template: pageRow.template,
        },
        sections: sections.map((s) => ({
            id: s.id,
            sectionKey: s.sectionKey,
            title: s.title,
            content: s.content,
            sortOrder: s.sortOrder,
        })),
    };
}

/** Admin: list pages. */
export async function getPagesForAdmin(): Promise<{ id: number; slug: string; title: string; template: string | null }[]> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") return [];
    return db.select({ id: pages.id, slug: pages.slug, title: pages.title, template: pages.template }).from(pages);
}

/** Admin: get page by id with sections. */
export async function getPageByIdForAdmin(id: number) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") return null;
    const [pageRow] = await db.select().from(pages).where(eq(pages.id, id));
    if (!pageRow) return null;
    const sections = await db.select().from(pageSections).where(eq(pageSections.pageId, id)).orderBy(asc(pageSections.sortOrder));
    return { page: pageRow, sections };
}

/** Admin: create or update page (upsert by slug). */
export async function savePage(formData: FormData): Promise<{ success: boolean; message: string; id?: number }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const slug = (formData.get("slug") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    if (!slug || !title) return { success: false, message: "Slug dan judul wajib." };
    try {
        const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug));
        if (existing.length > 0) {
            await db.update(pages).set({
                title,
                description: (formData.get("description") as string) || null,
                template: (formData.get("template") as string) || "default",
                content: (formData.get("content") as string) || null,
            }).where(eq(pages.id, existing[0].id));
            revalidatePath("/");
            revalidatePath("/persiapan");
            revalidatePath("/silabus");
            revalidatePath("/tentang");
            return { success: true, message: "Halaman diperbarui.", id: existing[0].id };
        } else {
            const [r] = await db.insert(pages).values({
                slug,
                title,
                description: (formData.get("description") as string) || null,
                template: (formData.get("template") as string) || "default",
                content: (formData.get("content") as string) || null,
                publishedAt: new Date(),
            }).$returningId();
            revalidatePath("/");
            return { success: true, message: "Halaman dibuat.", id: r?.id };
        }
    } catch (e) {
        console.error("savePage error:", e);
        return { success: false, message: "Gagal menyimpan." };
    }
}

/** Wrapper for use as form action; returns void as required by React form action type. */
export async function savePageFormAction(formData: FormData): Promise<void> {
    await savePage(formData);
}

/** Admin: save section. */
export async function savePageSection(pageId: number, formData: FormData): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    const sectionKey = (formData.get("sectionKey") as string)?.trim() || "section";
    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, message: "Judul section wajib." };
    const sectionId = formData.get("sectionId");
    try {
        if (sectionId && Number(sectionId) > 0) {
            await db.update(pageSections).set({
                sectionKey,
                title,
                content: (formData.get("content") as string) || null,
                sortOrder: parseInt(String(formData.get("sortOrder")), 10) || 0,
            }).where(eq(pageSections.id, Number(sectionId)));
        } else {
            await db.insert(pageSections).values({
                pageId,
                sectionKey,
                title,
                content: (formData.get("content") as string) || null,
                sortOrder: parseInt(String(formData.get("sortOrder")), 10) || 0,
            });
        }
        revalidatePath("/persiapan");
        revalidatePath("/silabus");
        return { success: true, message: "Section tersimpan." };
    } catch (e) {
        console.error("savePageSection error:", e);
        return { success: false, message: "Gagal menyimpan." };
    }
}

/** Admin: delete section. */
export async function deletePageSection(sectionId: number): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") {
        return { success: false, message: "Unauthorized" };
    }
    try {
        await db.delete(pageSections).where(eq(pageSections.id, sectionId));
        revalidatePath("/persiapan");
        revalidatePath("/silabus");
        return { success: true, message: "Section dihapus." };
    } catch (e) {
        console.error("deletePageSection error:", e);
        return { success: false, message: "Gagal menghapus." };
    }
}
