import { BookOpen, Clock, Calendar, CheckCircle } from "lucide-react";
import ProgressCard from "./peserta/ProgressCard";
import WeeklyProgressChart from "./peserta/WeeklyProgressChart";
import ExamHistoryTable from "./peserta/ExamHistoryTable";
import { getExamHistory } from "@/app/actions/exams";
import { getUserStats } from "@/app/actions/progress";
import ProgressCharts from "./progress/ProgressCharts";

export default async function PesertaDashboard() {
    const historyData = await getExamHistory(1, 5); // Get first page with 5 items
    const lastExam = historyData.data.length > 0 ? historyData.data[0] : null;
    const stats = await getUserStats();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-dark">Dashboard Peserta</h2>
                <p className="text-text-dark/60">Welcome back! Here is your learning overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProgressCard
                    title="Book Progress"
                    value={stats ? `${stats.materials.percentage}%` : "0%"}
                    label={`${stats?.materials.completed || 0} of ${stats?.materials.total || 0} completed`}
                    icon={BookOpen}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <ProgressCard
                    title="Last Practice"
                    value={lastExam?.score != null ? `${lastExam.score}/100` : "-"}
                    label={lastExam ? (lastExam.examTitle || "Recent exam") : "Start your first exam"}
                    icon={CheckCircle}
                    colorClass="bg-green-100 text-green-600"
                />
                <ProgressCard
                    title="Exams Taken"
                    value={stats?.exams.totalTaken.toString() || "0"}
                    label={(stats?.exams?.totalTaken || 0) > 0 ? `Avg Score: ${stats!.exams.averageScore}` : "No exams yet"}
                    icon={Calendar}
                    colorClass="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Charts Section */}
            {stats && (
                <div className="space-y-6">
                    <ProgressCharts
                        categoryData={stats.categoryPerformance}
                        weeklyData={stats.weeklyActivity as any}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Side Panel / Additional Stats or Actions - Takes up 1 column */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Exam Schedule List (Simplified) - Keeping placeholder for now as we don't have scheduled exams feature fully built yet */}
                    {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                        <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Upcoming Schedule
                        </h3>
                         <p className="text-text-dark/60 text-sm">No upcoming scheduled exams.</p>
                    </div> */}
                </div>
            </div>

            {/* Detailed History Table */}
            <div>
                <ExamHistoryTable initialData={historyData} />
            </div>
        </div>
    );
}
