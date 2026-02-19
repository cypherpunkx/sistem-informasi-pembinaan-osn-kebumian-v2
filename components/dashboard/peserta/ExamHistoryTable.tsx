"use client";

import { useState } from "react";
import { getExamHistory } from "@/app/actions/exams";
import { ChevronLeft, ChevronRight, Award, Target, TrendingUp } from "lucide-react";

import FeedbackBadge from "./FeedbackBadge";

interface ExamHistoryItem {
    id: number;
    date: Date | null;
    examTitle: string | null;
    score: number | null;
    totalQuestions?: number | null;
    status: "COMPLETED" | "IN_PROGRESS" | null;
    feedback: string | null;
}

interface PaginationData {
    data: ExamHistoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Warna score berdasarkan range: ≥75 hijau, 60-74 oranye, <60 merah. Kiri = score, kanan = jumlah soal (opsional). */
function scoreDisplay(score: number | null, totalQuestions?: number | null) {
    if (score == null) return { scoreText: "-", totalLabel: null, className: "text-text-dark/60" };
    const totalLabel = totalQuestions && totalQuestions > 0 ? `${totalQuestions} soal` : null;
    if (score >= 75) return { scoreText: String(score), totalLabel, className: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded" };
    if (score >= 60) return { scoreText: String(score), totalLabel, className: "text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded" };
    return { scoreText: String(score), totalLabel, className: "text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded" };
}

interface SummaryStats {
    totalCompleted: number;
    averageScore: number;
    bestScore: number;
}

export default function ExamHistoryTable({
    initialData,
    summary,
}: {
    initialData: PaginationData;
    /** Opsional: ringkasan untuk ditampilkan di atas tabel. */
    summary?: SummaryStats | null;
}) {
    const [currentPage, setCurrentPage] = useState(initialData.page);
    const [data, setData] = useState<ExamHistoryItem[]>(initialData.data);
    const [totalPages, setTotalPages] = useState(initialData.totalPages);
    const [total, setTotal] = useState(initialData.total);
    const [loading, setLoading] = useState(false);

    const fetchPage = async (page: number) => {
        setLoading(true);
        try {
            const result = await getExamHistory(page, 5);
            setData(result.data as ExamHistoryItem[]);
            setTotalPages(result.totalPages);
            setTotal(result.total);
            setCurrentPage(result.page);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            fetchPage(page);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-dark">Recent Practice History</h3>
                <div className="text-sm text-text-dark/60">
                    Total: {total} exams
                </div>
            </div>

            {/* Mini summary: total completed, avg score, best score */}
            {summary && (summary.totalCompleted > 0 || summary.averageScore > 0 || summary.bestScore > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 rounded-lg bg-neutral-light/50 border border-neutral-warm/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Exam selesai</p>
                            <p className="text-lg font-bold text-text-dark">{summary.totalCompleted}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Rata-rata skor</p>
                            <p className="text-lg font-bold text-text-dark">{summary.averageScore}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Skor terbaik</p>
                            <p className="text-lg font-bold text-text-dark">{summary.bestScore}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead className="bg-neutral-light">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Exam Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Feedback</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-warm/20">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-text-dark/50 italic">
                                    Loading...
                                </td>
                            </tr>
                        ) : data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-neutral-warm/5">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                        {item.date ? new Date(item.date).toLocaleString('id-ID', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            timeZone: 'Asia/Jakarta'
                                        }) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">
                                        {item.examTitle || "Unknown Exam"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.status === "COMPLETED" ? (() => {
                                            const { scoreText, totalLabel, className } = scoreDisplay(item.score, item.totalQuestions);
                                            return (
                                                <span className="inline-flex items-baseline gap-2">
                                                    <span className={`text-base ${className}`}>{scoreText}</span>
                                                    {totalLabel && <span className="text-xs text-text-dark/50">{totalLabel}</span>}
                                                </span>
                                            );
                                        })() : (
                                            <span className="text-sm text-text-dark/60">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                                                item.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-red-100 text-red-800"}`}>
                                            {item.status?.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {item.feedback ? (
                                            <FeedbackBadge feedback={item.feedback} feedbackDate={item.date} />
                                        ) : (
                                            <span className="text-text-dark/40 italic text-xs">No feedback</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-text-dark/50 italic">
                                    No exam history found. Start a practice session!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-warm/20">
                    <div className="text-sm text-text-dark/60">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-2 rounded-lg border border-neutral-warm/20 text-text-dark hover:bg-neutral-warm/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        {/* Page numbers */}
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => goToPage(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-2 rounded-lg border transition-colors ${currentPage === pageNum
                                            ? "bg-accent-earthy text-white border-accent-earthy"
                                            : "border-neutral-warm/20 text-text-dark hover:bg-neutral-warm/10"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || loading}
                            className="px-3 py-2 rounded-lg border border-neutral-warm/20 text-text-dark hover:bg-neutral-warm/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
