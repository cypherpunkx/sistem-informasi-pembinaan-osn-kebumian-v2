import { getUserStats } from "@/app/actions/progress";
import ProgressCharts from "@/components/dashboard/progress/ProgressCharts";
import { BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ProgressPage() {
    const stats = await getUserStats();

    if (!stats) {
        return <div className="p-6">Loading stats...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-dark">My Learning Progress</h1>
                <p className="text-text-dark/60 mt-2">Detailed overview of your study performance.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-dark/60">Materials Read</p>
                        <h3 className="text-2xl font-bold text-text-dark">{stats.materials.completed} <span className="text-sm font-normal text-text-dark/50">/ {stats.materials.total}</span></h3>
                        <div className="w-full bg-neutral-light h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${stats.materials.percentage}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-dark/60">Exams Completed</p>
                        <h3 className="text-2xl font-bold text-text-dark">{stats.exams.totalTaken}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-dark/60">Average Score</p>
                        <h3 className="text-2xl font-bold text-text-dark">{stats.exams.averageScore}</h3>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div>
                <h2 className="text-xl font-bold text-text-dark mb-4">Performance Analytics</h2>
                <ProgressCharts
                    categoryData={stats.categoryPerformance}
                    weeklyData={stats.weeklyActivity as any}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <Link
                    href="/dashboard/latihan-ujian"
                    className="px-6 py-3 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors shadow-md"
                >
                    Start New Practice
                </Link>
            </div>
        </div>
    );
}
