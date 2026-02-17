import { Suspense } from "react";
import { getUserStats, getAllUsers, getSchoolsForFilter } from "@/app/actions/users";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Users, UserCheck, GraduationCap, Shield } from "lucide-react";
import UserManagementContent from "@/components/dashboard/users/UserManagementContent";

export default async function ManajemenPenggunaPage() {
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="p-6">
                <p className="text-red-600">Unauthorized. Please log in.</p>
            </div>
        );
    }

    // Check admin access
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session.user.id)),
    });

    if (currentUser?.role !== "admin") {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
                    <p className="text-red-600">This page is only accessible to administrators.</p>
                </div>
            </div>
        );
    }

    // Fetch initial data
    const stats = await getUserStats();
    const initialUsers = await getAllUsers({ page: 1, limit: 20 });
    const schools = await getSchoolsForFilter();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-dark">User Management</h1>
                <p className="text-text-dark/60 mt-2">Manage users, roles, and permissions</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Users */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-dark/60 font-medium">Total Users</p>
                                <p className="text-3xl font-bold text-text-dark mt-2">{stats.totalUsers}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs text-text-dark/50 mt-4">
                            +{stats.recentRegistrations} in last 30 days
                        </p>
                    </div>

                    {/* Admins */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-dark/60 font-medium">Admins</p>
                                <p className="text-3xl font-bold text-text-dark mt-2">{stats.adminCount}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Shield className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                ADMIN
                            </span>
                        </div>
                    </div>

                    {/* Pembina */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-dark/60 font-medium">Pembina</p>
                                <p className="text-3xl font-bold text-text-dark mt-2">{stats.pembinaCount}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <UserCheck className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                PEMBINA
                            </span>
                        </div>
                    </div>

                    {/* Peserta */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-dark/60 font-medium">Peserta</p>
                                <p className="text-3xl font-bold text-text-dark mt-2">{stats.pesertaCount}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                PESERTA
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <Suspense fallback={<div className="text-center py-8">Loading users...</div>}>
                <UserManagementContent initialUsers={initialUsers} schools={schools} />
            </Suspense>
        </div>
    );
}
