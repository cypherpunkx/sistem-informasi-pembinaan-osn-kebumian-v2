"use server";

import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { eq, like, or, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
        filters.push(eq(materials.type, type as any));
    }

    if (status && status !== "All") {
        filters.push(eq(materials.status, status as any));
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



export async function createMaterial(prevState: any, formData: FormData) {
    const session = await auth();
    const userRole = session?.user?.role || "pembina";

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
    const userRole = session?.user?.role || "pembina";

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
    try {
        await db.delete(materials).where(eq(materials.id, id));
        revalidatePath("/dashboard/manajemen-materi");
        revalidatePath("/dashboard/materi");
        return { message: "Material deleted." };
    } catch (error) {
        return { message: "Database Error: Failed to Delete Material." };
    }
}

export async function updateMaterialStatus(id: number, status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED") {
    try {
        await db.update(materials).set({ status }).where(eq(materials.id, id));
        revalidatePath("/dashboard/manajemen-materi");
        revalidatePath("/dashboard/materi");
        return { success: true, message: "Status updated." };
    } catch (error) {
        return { success: false, message: "Failed to update status." };
    }
}
