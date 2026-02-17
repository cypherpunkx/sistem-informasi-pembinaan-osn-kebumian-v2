"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, or, like, sql, desc, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

// Filters interface
interface UserFilters {
    role?: "admin" | "pembina" | "peserta";
    school?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "email" | "role" | "createdAt";
    sortOrder?: "asc" | "desc";
}

// User data interface for creation/update
interface UserData {
    name: string;
    email: string;
    password?: string;
    role: "admin" | "pembina" | "peserta";
    school?: string;
    contact?: string;
    competitionCategory?: string;
}

/**
 * Get all users with filtering, sorting, and pagination
 * Admin only
 */
export async function getAllUsers(filters: UserFilters = {}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        }

        // Check admin access
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            console.error("Unauthorized: Admin access required");
            return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        }

        const {
            role,
            school,
            search,
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = filters;

        // Build where conditions
        const conditions = [];

        if (role) {
            conditions.push(eq(users.role, role));
        }

        if (school) {
            conditions.push(eq(users.school, school));
        }

        if (search) {
            conditions.push(
                or(
                    like(users.name, `%${search}%`),
                    like(users.email, `%${search}%`)
                )
            );
        }

        // Get total count
        const whereClause = conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined;

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(whereClause);

        const total = Number(countResult?.count || 0);
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Determine sort column
        const sortColumn = sortBy === "name" ? users.name
            : sortBy === "email" ? users.email
                : sortBy === "role" ? users.role
                    : users.createdAt;

        const orderClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

        // Get paginated data
        const usersData = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                school: users.school,
                contact: users.contact,
                competitionCategory: users.competitionCategory,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(whereClause)
            .orderBy(orderClause)
            .limit(limit)
            .offset(offset);

        return {
            data: usersData,
            total,
            page,
            limit,
            totalPages,
        };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
}

/**
 * Get user by ID
 * Admin only
 */
export async function getUserById(userId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            console.error("Unauthorized: Admin access required");
            return null;
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) return null;

        // Don't return password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

/**
 * Create new user
 * Admin only
 */
export async function createUser(userData: UserData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return { success: false, message: "Admin access required" };
        }

        // Validate required fields
        if (!userData.name || !userData.email || !userData.password || !userData.role) {
            return { success: false, message: "Name, email, password, and role are required" };
        }

        // Validate password length
        if (userData.password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters" };
        }

        // Check email uniqueness
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, userData.email),
        });

        if (existingUser) {
            return { success: false, message: "Email already exists" };
        }

        // Hash password
        const hashedPassword = await hash(userData.password, 10);

        // Create user
        await db.insert(users).values({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            school: userData.school || null,
            contact: userData.contact || null,
            competitionCategory: userData.competitionCategory || null,
        });

        revalidatePath("/dashboard/manajemen-pengguna");

        return { success: true, message: "User created successfully" };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, message: "Failed to create user" };
    }
}

/**
 * Update user
 * Admin only
 */
export async function updateUser(userId: number, userData: Partial<UserData>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return { success: false, message: "Admin access required" };
        }

        // Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!existingUser) {
            return { success: false, message: "User not found" };
        }

        // Check email uniqueness if email is being updated
        if (userData.email && userData.email !== existingUser.email) {
            const emailExists = await db.query.users.findFirst({
                where: eq(users.email, userData.email),
            });

            if (emailExists) {
                return { success: false, message: "Email already exists" };
            }
        }

        // Prepare update data
        const updateData: any = {};

        if (userData.name) updateData.name = userData.name;
        if (userData.email) updateData.email = userData.email;
        if (userData.role) updateData.role = userData.role;
        if (userData.school !== undefined) updateData.school = userData.school || null;
        if (userData.contact !== undefined) updateData.contact = userData.contact || null;
        if (userData.competitionCategory !== undefined) {
            updateData.competitionCategory = userData.competitionCategory || null;
        }

        // Hash password if provided
        if (userData.password && userData.password.length >= 6) {
            updateData.password = await hash(userData.password, 10);
        }

        // Update user
        await db.update(users).set(updateData).where(eq(users.id, userId));

        revalidatePath("/dashboard/manajemen-pengguna");

        return { success: true, message: "User updated successfully" };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, message: "Failed to update user" };
    }
}

/**
 * Delete user with safety checks
 * Admin only
 */
export async function deleteUser(userId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return { success: false, message: "Admin access required" };
        }

        // Prevent self-deletion
        if (userId === currentUser.id) {
            return { success: false, message: "You cannot delete your own account" };
        }

        // Check if user exists
        const userToDelete = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!userToDelete) {
            return { success: false, message: "User not found" };
        }

        // Prevent deletion of last admin
        if (userToDelete.role === "admin") {
            const [adminCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .where(eq(users.role, "admin"));

            if (Number(adminCount?.count || 0) <= 1) {
                return { success: false, message: "Cannot delete the last admin user" };
            }
        }

        // Delete user
        await db.delete(users).where(eq(users.id, userId));

        revalidatePath("/dashboard/manajemen-pengguna");

        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, message: "Failed to delete user" };
    }
}

/**
 * Update user role with validation
 * Admin only
 */
export async function updateUserRole(userId: number, newRole: "admin" | "pembina" | "peserta") {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: "Unauthorized" };
        }

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return { success: false, message: "Admin access required" };
        }

        // Check if user exists
        const userToUpdate = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!userToUpdate) {
            return { success: false, message: "User not found" };
        }

        // Prevent changing last admin role
        if (userToUpdate.role === "admin" && newRole !== "admin") {
            const [adminCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(users)
                .where(eq(users.role, "admin"));

            if (Number(adminCount?.count || 0) <= 1) {
                return { success: false, message: "Cannot change role of the last admin" };
            }
        }

        // Update role
        await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

        revalidatePath("/dashboard/manajemen-pengguna");

        return { success: true, message: "User role updated successfully" };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, message: "Failed to update user role" };
    }
}

/**
 * Get user statistics
 * Admin only
 */
export async function getUserStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return null;
        }

        // Total users
        const [totalUsers] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users);

        // Count by role
        const [adminCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(eq(users.role, "admin"));

        const [pembinaCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(eq(users.role, "pembina"));

        const [pesertaCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(eq(users.role, "peserta"));

        // Recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [recentCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`);

        return {
            totalUsers: Number(totalUsers?.count || 0),
            adminCount: Number(adminCount?.count || 0),
            pembinaCount: Number(pembinaCount?.count || 0),
            pesertaCount: Number(pesertaCount?.count || 0),
            recentRegistrations: Number(recentCount?.count || 0),
        };
    } catch (error) {
        console.error("Failed to fetch user stats:", error);
        return null;
    }
}

/**
 * Get list of schools for filter dropdown
 * Admin only
 */
export async function getSchoolsForFilter() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, parseInt(session.user.id)),
        });

        if (currentUser?.role !== "admin") {
            return [];
        }

        const schools = await db
            .selectDistinct({ school: users.school })
            .from(users)
            .where(sql`${users.school} IS NOT NULL AND ${users.school} != ''`)
            .orderBy(users.school);

        return schools.map((s) => s.school).filter(Boolean) as string[];
    } catch (error) {
        console.error("Failed to fetch schools:", error);
        return [];
    }
}
