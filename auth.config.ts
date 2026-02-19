import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;
            const role = auth?.user?.role as "admin" | "pembina" | "peserta" | undefined;

            // Hanya dashboard yang perlu proteksi login/role
            if (!pathname.startsWith("/dashboard")) {
                return true;
            }

            // Belum login → tidak boleh akses dashboard
            if (!isLoggedIn) {
                return false;
            }

            // Admin-only area
            if (pathname.startsWith("/dashboard/manajemen-pengguna")) {
                return role === "admin";
            }

            // Pembina atau admin (manajemen konten & nilai)
            if (
                pathname.startsWith("/dashboard/manajemen-materi") ||
                pathname.startsWith("/dashboard/bank-soal") ||
                pathname.startsWith("/dashboard/nilai")
            ) {
                return role === "pembina" || role === "admin";
            }

            // Area khusus peserta: latihan & ujian
            if (pathname.startsWith("/dashboard/latihan-ujian")) {
                return role === "peserta";
            }

            // Dashboard umum & halaman lain di bawah /dashboard → cukup login
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
