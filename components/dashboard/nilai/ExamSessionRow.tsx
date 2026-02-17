"use client";

import { useState } from "react";
import { Eye, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import ExamSessionDetail from "./ExamSessionDetail";

interface SessionData {
    sessionId: number;
    userId: string;
    examId: number;
    score: number | null;
    endTime: Date | null;
    feedback: string | null;
    totalQuestions: number | null;
    correctAnswers: number | null;
    studentName: string | null;
    studentEmail: string | null;
    examTitle: string | null;
    examCategory: string | null;
}

interface ExamSessionRowProps {
    session: SessionData;
}

export default function ExamSessionRow({ session }: ExamSessionRowProps) {
    const [showDetail, setShowDetail] = useState(false);

    const formatDate = (date: Date | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getScoreBadgeColor = (score: number | null) => {
        if (score === null) return "bg-gray-100 text-gray-600";
        if (score >= 80) return "bg-green-100 text-green-700";
        if (score >= 60) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    return (
        <>
            <tr className="hover:bg-neutral-light/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div className="text-sm font-medium text-text-dark">
                            {session.studentName || session.studentEmail}
                        </div>
                        {session.studentName && (
                            <div className="text-xs text-text-dark/60">{session.studentEmail}</div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="text-sm text-text-dark">{session.examTitle}</div>
                    {session.examCategory && (
                        <div className="text-xs text-text-dark/60">{session.examCategory}</div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreBadgeColor(
                            session.score
                        )}`}
                    >
                        {session.score ?? "N/A"}
                    </span>
                    <div className="text-xs text-text-dark/60 mt-1">
                        {session.correctAnswers}/{session.totalQuestions} correct
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">{formatDate(session.endTime)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {session.feedback ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Added</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Pending</span>
                        </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                        onClick={() => setShowDetail(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>
                </td>
            </tr>

            {showDetail && <ExamSessionDetail sessionId={session.sessionId} onClose={() => setShowDetail(false)} />}
        </>
    );
}
