"use server";

import { db } from "@/lib/db";
import { materials, users } from "@/lib/schema";
import { eq, like, or, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

export async function getMaterials({
    search,
    topic,
    type,
    status
}: {
    search?: string;
    topic?: string;
    type?: string;
    status?: string;
}) {
    const session = await auth();
    const userRole = session?.user?.role;

    // Enforce strict filtering for students
    if (userRole === "peserta") {
        status = "PUBLISHED";
    }

    // Build filters dynamically
    const filters = [];

    if (search) {
        filters.push(or(like(materials.title, `%${search}%`), like(materials.description, `%${search}%`)));
    }

    if (topic && topic !== "All") {
        filters.push(eq(materials.topic, topic));
    }

    if (type && type !== "All") {
        filters.push(eq(materials.type, type as "PDF" | "VIDEO" | "SLIDE" | "TEXT"));
    }

    if (status && status !== "All") {
        filters.push(eq(materials.status, status as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED"));
    }

    try {
        const data = await db
            .select()
            .from(materials)
            .where(and(...filters))
            .orderBy(desc(materials.createdAt));
        return data;
    } catch (error) {
        console.error("Failed to fetch materials:", error);
        return [];
    }
}

export interface GetMaterialsForPesertaResult {
    data: Awaited<ReturnType<typeof getMaterials>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export interface MaterialFilters {
    search?: string;
    topic?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface GetMaterialsFilteredResult {
    data: Awaited<ReturnType<typeof getMaterials>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getMaterialsFiltered(filters: MaterialFilters = {}): Promise<GetMaterialsFilteredResult> {
    const session = await auth();
    const userRole = session?.user?.role;
    if (userRole !== "admin" && userRole !== "pembina") {
        return { data: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 };
    }

    const { search, topic, type, status, page = 1, limit: rawLimit = DEFAULT_PAGE_SIZE } = filters;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawLimit));

    const conditions = [];
    if (search?.trim()) {
        conditions.push(or(like(materials.title, `%${search.trim()}%`), like(materials.description, `%${search.trim()}%`)));
    }
    if (topic && topic !== "All") conditions.push(eq(materials.topic, topic));
    if (type && type !== "All") conditions.push(eq(materials.type, type as "PDF" | "VIDEO" | "SLIDE" | "TEXT"));
    if (status && status !== "All") conditions.push(eq(materials.status, status as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (Math.max(1, page) - 1) * limit;

    const data = await db
        .select()
        .from(materials)
        .where(whereClause)
        .orderBy(desc(materials.createdAt))
        .limit(limit)
        .offset(offset);

    return { data, total, page: Math.max(1, page), limit, totalPages };
}

export interface GetPendingMaterialsFilteredResult {
    data: Awaited<ReturnType<typeof getMaterials>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export async function getPendingMaterialsFiltered(filters: { page?: number; limit?: number } = {}): Promise<GetPendingMaterialsFilteredResult> {
    const { page = 1, limit: rawLimit = DEFAULT_PAGE_SIZE } = filters;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawLimit));

    const whereClause = eq(materials.status, "PENDING");

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (Math.max(1, page) - 1) * limit;

    const data = await db
        .select()
        .from(materials)
        .where(whereClause)
        .orderBy(desc(materials.createdAt))
        .limit(limit)
        .offset(offset);

    return { data, total, page: Math.max(1, page), limit, totalPages };
}

export async function getMaterialsForPeserta(filters: {
    search?: string;
    topic?: string;
    type?: string;
    page?: number;
    limit?: number;
} = {}): Promise<GetMaterialsForPesertaResult> {
    const session = await auth();
    if (session?.user?.role !== "peserta") {
        return { data: [], total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 };
    }

    const { search, topic, type, page = 1, limit: rawLimit = DEFAULT_PAGE_SIZE } = filters;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawLimit));

    const conditions = [eq(materials.status, "PUBLISHED")];
    if (search?.trim()) {
        const searchCond = or(like(materials.title, `%${search.trim()}%`), like(materials.description, `%${search.trim()}%`));
        if (searchCond) conditions.push(searchCond);
    }
    if (topic && topic !== "All") conditions.push(eq(materials.topic, topic));
    if (type && type !== "All") conditions.push(eq(materials.type, type as "PDF" | "VIDEO" | "SLIDE" | "TEXT"));

    const whereClause = and(...conditions);

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(materials)
        .where(whereClause);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (Math.max(1, page) - 1) * limit;

    const data = await db
        .select()
        .from(materials)
        .where(whereClause)
        .orderBy(desc(materials.createdAt))
        .limit(limit)
        .offset(offset);

    return { data, total, page: Math.max(1, page), limit, totalPages };
}

export async function getMaterialById(id: number) {
    try {
        const [material] = await db
            .select()
            .from(materials)
            .where(eq(materials.id, id))
            .limit(1);
        return material;
    } catch (error) {
        console.error("Failed to fetch material:", error);
        return null;
    }
}



export async function createMaterial(_prevState: unknown, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { message: "Unauthorized" };
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (currentUser?.role === "peserta") return { message: "Peserta hanya boleh mengerjakan ujian." };
    const userRole = currentUser?.role || "pembina";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "PDF" | "VIDEO" | "SLIDE" | "TEXT";
    const url = formData.get("url") as string;
    const topic = formData.get("topic") as string;
    const tagsRaw = formData.get("tags") as string; // Comma separated
    const requestedStatus = (formData.get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";

    // Enforce role-based status
    let finalStatus = requestedStatus;
    if (userRole === "pembina" && requestedStatus === "PUBLISHED") {
        finalStatus = "PENDING";
    }

    // Simple validation
    if (!title || !type || !url || !topic) {
        return { message: "Missing required fields" };
    }

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()) : [];

    try {
        await db.insert(materials).values({
            title,
            description,
            type,
            url,
            topic,
            tags: tags,
            status: finalStatus,
        });

        revalidatePath("/dashboard/manajemen-materi");
        revalidatePath("/dashboard/materi");
        return {
            success: true,
            message: finalStatus === "PENDING" ? "Material submitted for approval" : "Material added successfully"
        };
    } catch (error) {
        console.error("Failed to create material:", error);
        return { message: "Database Error: Failed to Create Material." };
    }
}

export async function updateMaterial(id: number, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { message: "Unauthorized" };
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (currentUser?.role === "peserta") return { message: "Peserta hanya boleh mengerjakan ujian." };
    const userRole = currentUser?.role || "pembina";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "PDF" | "VIDEO" | "SLIDE" | "TEXT";
    const url = formData.get("url") as string;
    const topic = formData.get("topic") as string;
    const tagsRaw = formData.get("tags") as string;
    const requestedStatus = (formData.get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";

    // Enforce role-based status
    let finalStatus = requestedStatus;
    if (userRole === "pembina" && requestedStatus === "PUBLISHED") {
        finalStatus = "PENDING";
    }

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()) : [];

    try {
        await db.update(materials)
            .set({
                title,
                description,
                type,
                url,
                topic,
                tags: tags,
                status: finalStatus,
            })
            .where(eq(materials.id, id));

        revalidatePath("/dashboard/manajemen-materi");
        revalidatePath("/dashboard/materi");
        return {
            success: true,
            message: finalStatus === "PENDING" ? "Material updated and submitted for approval" : "Material updated successfully"
        };
    } catch (error) {
        console.error("Failed to update material:", error);
        return { message: "Database Error: Failed to Update Material." };
    }
}

export async function deleteMaterial(id: number) {
    const session = await auth();
    if (!session?.user?.id) return { message: "Unauthorized" };
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(String(session.user.id), 10)),
    });
    if (currentUser?.role === "peserta") return { message: "Peserta hanya boleh mengerjakan ujian." };
    try {
        await db.delete(materials).where(eq(materials.id, id));
        revalidatePath("/dashboard/manajemen-materi");
        revalidatePath("/dashboard/materi");
        return { message: "Material deleted." };
    } catch (error) {
        console.error("Failed to delete material:", error);
        return { message: "Database Error: Failed to Delete Material." };
    }
}

export async function updateMaterialStatus(id: number, status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });
    if (!currentUser) return { success: false, message: "User not found" };

    if (status === "PUBLISHED" && currentUser.role !== "admin") {
        return { success: false, message: "Hanya admin yang dapat menerbitkan (publish) materi." };
    }

    try {
        await db.update(materials).set({ status }).where(eq(materials.id, id));
        revalidatePath("/dashboard/manajemen-materi");
        revalidatePath("/dashboard/materi");
        return { success: true, message: "Status updated." };
    } catch (error) {
        console.error("Failed to update material status:", error);
        return { success: false, message: "Failed to update status." };
    }
}
