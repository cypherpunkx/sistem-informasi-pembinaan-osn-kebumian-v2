"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { parse, object, string, email, minLength, safeParse, pipe, minLength as vMinLength, optional } from "valibot";

// Helper to validate schema
const RegisterSchema = object({
    name: pipe(string(), vMinLength(1, "Name is required")),
    email: pipe(string(), email("Invalid email address")),
    password: pipe(string(), vMinLength(6, "Password must be at least 6 characters")),
    role: string(), // We'll validate strict enum values if needed or trust the select for now (safeguard in DB)
    school: optional(string()),
    contact: optional(string()),
    competitionCategory: optional(string()),
});

export async function register(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // Safe parse with Valibot
    const result = safeParse(RegisterSchema, rawData);

    if (!result.success) {
        return {
            error: result.issues.map((issue) => issue.message).join(", "),
        };
    }

    const { name, email, password, role, school, contact, competitionCategory } = result.output;

    try {
        // Check if user exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser) {
            return { error: "User already exists with this email." };
        }

        const hashedPassword = await hash(password, 10);

        // Insert user
        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: role as "admin" | "pembina" | "peserta",
            school: school || null,
            contact: contact || null,
            competitionCategory: competitionCategory || null,
        });

        return { success: "User created successfully! Please log in." };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Failed to create user." };
    }
}

export async function authenticate(
    prevState: { error?: string; email?: string } | undefined,
    formData: FormData
) {
    try {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        // Basic validation
        if (!email || !password) {
            return {
                error: "Please enter both email and password.",
                email: email || "",
            };
        }

        // Check if user exists first
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return {
                error: "No account found with this email address.",
                email: email,
            };
        }

        // Attempt sign in
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            const email = formData.get("email") as string;
            switch (error.type) {
                case "CredentialsSignin":
                    return {
                        error: "Incorrect password. Please try again.",
                        email: email,
                    };
                case "CallbackRouteError":
                    return {
                        error: "Incorrect password. Please try again.",
                        email: email,
                    };
                default:
                    return {
                        error: "Authentication failed. Please try again.",
                        email: email,
                    };
            }
        }
        throw error;
    }
}

export async function logout() {
    await signOut({ redirectTo: "/login" });
}

export async function updateProfile(formData: {
    name: string;
    email: string;
    school?: string;
    currentPassword?: string;
    newPassword?: string;
}) {
    try {
        const { auth: getSession } = await import("@/auth");
        const session = await getSession();

        if (!session?.user?.email) {
            return { success: false, message: "Unauthorized" };
        }

        // Get current user
        const [currentUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, session.user.email))
            .limit(1);

        if (!currentUser) {
            return { success: false, message: "User not found" };
        }

        // Prepare update data
        const updateData: any = {
            name: formData.name,
            school: formData.school || null,
        };

        // Handle password change
        if (formData.newPassword && formData.currentPassword) {
            const bcrypt = await import("bcryptjs");

            // Verify current password
            const isValid = await bcrypt.compare(formData.currentPassword, currentUser.password);
            if (!isValid) {
                return { success: false, message: "Current password is incorrect" };
            }

            // Hash new password
            updateData.password = await bcrypt.hash(formData.newPassword, 10);
        }

        // Handle email change
        if (formData.email !== session.user.email) {
            // Check if new email already exists
            const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, formData.email))
                .limit(1);

            if (existingUser) {
                return { success: false, message: "Email already in use" };
            }

            updateData.email = formData.email;
        }

        // Update user
        await db
            .update(users)
            .set(updateData)
            .where(eq(users.email, session.user.email));

        console.log("=== Profile Updated ===");
        console.log("User:", session.user.email);
        console.log("Updated fields:", Object.keys(updateData));
        console.log("=======================");

        return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { success: false, message: "Failed to update profile" };
    }
}
