import { Users, BookOpen, Clock, FileCheck } from "lucide-react";
import Link from "next/link";
import { getPembinaStats, getStudentProgress } from "@/app/actions/pembina";

export default async function PembinaDashboard() {
    const stats = await getPembinaStats();
    const students = await getStudentProgress();

    // Fallback if data fetch fails
    if (!stats) {
        return (
            <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
            </div>
        );
    }

    const formatLastActive = (date: Date | null) => {
        if (!date) return "Never";
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return "Just now";
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-dark">Instructor Dashboard</h2>
                <p className="text-text-dark/60">Monitor student progress and manage materials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Mentored Students</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.totalStudents}</p>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Uploaded Materials</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.totalMaterials}</p>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Pending Reviews</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.pendingReviews}</p>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                        <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Avg. Class Score</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.avgClassScore}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Student Progress Overview</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-warm/20">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Material Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Avg. Exam Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-warm/20">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-neutral-light rounded-full h-2.5 max-w-[100px]">
                                                    <div className="bg-accent-earthy h-2.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, student.progress))}%` }}></div>
                                                </div>
                                                <span className="text-xs text-text-dark/60">{student.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">{student.avgScore}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">{formatLastActive(student.lastActive)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-text-dark/50 italic">
                                        No student data available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center">
                    <Link href="/dashboard/nilai" className="text-sm text-accent-earthy hover:underline">View All Students</Link>
                </div>
            </div>
        </div>
    );
}
