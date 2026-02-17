import { Suspense } from "react";
import { getStudentExamSessions, getNilaiStats, getStudentsForFilter, getExamsForFilter } from "@/app/actions/nilai";
import NilaiContent from "@/components/dashboard/nilai/NilaiContent";
import { FileCheck, MessageSquare, Users, TrendingUp } from "lucide-react";

export default async function NilaiPage() {
    // Fetch initial data
    const stats = await getNilaiStats();
    const initialSessions = await getStudentExamSessions({ page: 1, limit: 20 });
    const students = await getStudentsForFilter();
    const examsList = await getExamsForFilter();

    if (!stats) {
        return (
            <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-600">Unauthorized access. This page is for pembina only.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-dark">Nilai & Feedback</h1>
                <p className="text-text-dark/60 mt-2">Review student exam results and provide personalized feedback.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Total Sessions</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.totalSessions}</p>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">With Feedback</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.withFeedback}</p>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Pending Feedback</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.pendingFeedback}</p>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Avg. Score</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.avgClassScore}</p>
                    </div>
                </div>
            </div>

            {/* Main Content with Filters and Table */}
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <NilaiContent
                    initialSessions={initialSessions}
                    students={students}
                    examsList={examsList}
                />
            </Suspense>
        </div>
    );
}
