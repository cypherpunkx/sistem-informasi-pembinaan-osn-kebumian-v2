import { Users, FileText, Database, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getAdminDashboardStats } from "@/app/actions/dashboard";

export default async function AdminDashboard() {
    const stats = await getAdminDashboardStats();

    // Fallback values if stats fetch fails
    const totalUsers = stats?.totalUsers || 0;
    const totalQuestions = stats?.totalQuestions || 0;
    const totalMaterials = stats?.totalMaterials || 0;
    const activeExams = stats?.activeExams || 0;
    const newUsers = stats?.newUsers30Days || 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-dark">Overview</h2>
                <p className="text-text-dark/60">System-wide performance and statistics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Total Users</p>
                        <p className="text-2xl font-bold text-text-dark">{totalUsers.toLocaleString()}</p>
                        {newUsers > 0 && (
                            <p className="text-xs text-green-600 mt-1">+{newUsers} this month</p>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Total Questions</p>
                        <p className="text-2xl font-bold text-text-dark">{totalQuestions.toLocaleString()}</p>
                        {stats?.publishedQuestions !== undefined && (
                            <p className="text-xs text-text-dark/50 mt-1">
                                {stats.publishedQuestions} published
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Materials</p>
                        <p className="text-2xl font-bold text-text-dark">{totalMaterials.toLocaleString()}</p>
                        {stats?.publishedMaterials !== undefined && (
                            <p className="text-xs text-text-dark/50 mt-1">
                                {stats.publishedMaterials} published
                            </p>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Active Exams</p>
                        <p className="text-2xl font-bold text-text-dark">{activeExams}</p>
                        <p className="text-xs text-text-dark/50 mt-1">Currently scheduled</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h3 className="text-lg font-bold text-text-dark mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link href="/dashboard/manajemen-pengguna" className="block w-full p-3 text-center border border-accent-earthy/30 rounded-lg text-accent-earthy hover:bg-accent-earthy hover:text-white transition-colors">
                            Manage Users
                        </Link>
                        <Link href="/dashboard/bank-soal" className="block w-full p-3 text-center border border-accent-earthy/30 rounded-lg text-accent-earthy hover:bg-accent-earthy hover:text-white transition-colors">
                            Manage Question Bank
                        </Link>
                        <Link href="/dashboard/manajemen-materi" className="block w-full p-3 text-center border border-accent-earthy/30 rounded-lg text-accent-earthy hover:bg-accent-earthy hover:text-white transition-colors">
                            Manage Materials
                        </Link>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h3 className="text-lg font-bold text-text-dark mb-4">System Statistics</h3>
                    <div className="space-y-4">
                        {stats && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-dark/70">Published Questions</span>
                                    <span className="text-sm font-medium text-text-dark">
                                        {stats.publishedQuestions} / {stats.totalQuestions}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-dark/70">Draft Questions</span>
                                    <span className="text-sm font-medium text-text-dark">{stats.draftQuestions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-dark/70">New Users (30 days)</span>
                                    <span className="text-sm font-medium text-green-600">+{stats.newUsers30Days}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
