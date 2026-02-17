"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getExamSessionDetail } from "@/app/actions/nilai";
import FeedbackForm from "./FeedbackForm";

interface ExamSessionDetailProps {
    sessionId: number;
    onClose: () => void;
}

interface QuestionResult {
    questionNumber: number;
    id: number;
    content: string;
    type: string;
    topic: string | null;
    subtopic: string | null;
    difficulty: string;
    explanation: string | null;
    options: Array<{
        id: number;
        content: string;
        isCorrect: boolean;
    }>;
    userAnswer: string | null;
    isCorrect: boolean | null;
    correctAnswerId: number | undefined;
    correctAnswerContent: string | undefined;
}

interface SessionDetail {
    session: {
        id: number;
        score: number | null;
        endTime: Date | null;
        feedback: string | null;
        totalQuestions: number | null;
        correctAnswers: number | null;
    };
    student: {
        id: number | undefined;
        name: string | null | undefined;
        email: string | undefined;
    };
    exam: {
        id: number | undefined;
        title: string | undefined;
        category: string | null | undefined;
        duration: number | undefined;
    };
    results: QuestionResult[];
}

export default function ExamSessionDetail({ sessionId, onClose }: ExamSessionDetailProps) {
    const [detail, setDetail] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Handle client-side mounting
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            const data = await getExamSessionDetail(sessionId);
            setDetail(data);
            setLoading(false);
        }
        fetchDetail();
    }, [sessionId]);

    const handleFeedbackSuccess = async () => {
        // Refresh detail to show updated feedback
        const data = await getExamSessionDetail(sessionId);
        setDetail(data);
        setShowFeedbackForm(false);
    };

    // Don't render on server or before mounting
    if (!mounted) return null;

    const modalContent = loading ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8">
                <Loader2 className="w-8 h-8 animate-spin text-accent-earthy" />
            </div>
        </div>
    ) : !detail ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md">
                <p className="text-red-600">Failed to load exam session details.</p>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90"
                >
                    Close
                </button>
            </div>
        </div>
    ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-warm/20">
                    <div>
                        <h2 className="text-2xl font-bold text-text-dark">Exam Session Detail</h2>
                        <p className="text-sm text-text-dark/60 mt-1">
                            {detail.student.name || detail.student.email} • {detail.exam.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-light rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Summary */}
                <div className="p-6 bg-neutral-light/30 border-b border-neutral-warm/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-text-dark/60">Score</p>
                            <p className="text-2xl font-bold text-text-dark">{detail.session.score ?? "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-text-dark/60">Correct Answers</p>
                            <p className="text-2xl font-bold text-text-dark">
                                {detail.session.correctAnswers}/{detail.session.totalQuestions}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-dark/60">Completion Date</p>
                            <p className="text-sm font-medium text-text-dark">
                                {detail.session.endTime
                                    ? new Date(detail.session.endTime).toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-text-dark/60">Category</p>
                            <p className="text-sm font-medium text-text-dark">{detail.exam.category || "General"}</p>
                        </div>
                    </div>
                </div>

                {/* Question-by-Question Breakdown */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    <h3 className="text-lg font-bold text-text-dark mb-4">Question Breakdown</h3>
                    <div className="space-y-4">
                        {detail.results.map((result) => (
                            <div
                                key={result.id}
                                className={`p-4 rounded-lg border-2 ${result.isCorrect
                                    ? "border-green-200 bg-green-50"
                                    : "border-red-200 bg-red-50"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {result.isCorrect ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-text-dark">Q{result.questionNumber}</span>
                                            <span className="text-xs px-2 py-1 bg-white rounded-full text-text-dark/60">
                                                {result.difficulty}
                                            </span>
                                            {result.topic && (
                                                <span className="text-xs px-2 py-1 bg-white rounded-full text-text-dark/60">
                                                    {result.topic}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text-dark mb-3">{result.content}</p>

                                        {result.type === "MULTIPLE_CHOICE" && (
                                            <div className="space-y-2">
                                                {result.options.map((option) => {
                                                    const isUserAnswer = option.id === parseInt(result.userAnswer || "");
                                                    const isCorrectAnswer = option.isCorrect;

                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className={`p-2 rounded text-sm ${isCorrectAnswer
                                                                ? "bg-green-100 border border-green-300 font-semibold"
                                                                : isUserAnswer
                                                                    ? "bg-red-100 border border-red-300"
                                                                    : "bg-white border border-neutral-warm/20"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isCorrectAnswer && (
                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                )}
                                                                {isUserAnswer && !isCorrectAnswer && (
                                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                                )}
                                                                <span>{option.content}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {result.explanation && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                                <p className="font-semibold text-blue-900 mb-1">Explanation:</p>
                                                <p className="text-blue-800">{result.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="p-6 border-t border-neutral-warm/20">
                    <h3 className="text-lg font-bold text-text-dark mb-4">Feedback</h3>
                    {showFeedbackForm ? (
                        <FeedbackForm
                            sessionId={sessionId}
                            initialFeedback={detail.session.feedback || ""}
                            onSubmitSuccess={handleFeedbackSuccess}
                            onCancel={() => setShowFeedbackForm(false)}
                        />
                    ) : (
                        <div>
                            {detail.session.feedback ? (
                                <div className="p-4 bg-neutral-light/50 rounded-lg border border-neutral-warm/20">
                                    <p className="text-sm text-text-dark whitespace-pre-wrap">{detail.session.feedback}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-text-dark/60 italic">No feedback provided yet.</p>
                            )}
                            <button
                                onClick={() => setShowFeedbackForm(true)}
                                className="mt-4 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 transition-colors"
                            >
                                {detail.session.feedback ? "Edit Feedback" : "Add Feedback"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-warm/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-neutral-warm/30 text-text-dark rounded-lg hover:bg-neutral-light/50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    // Use portal to render outside of table structure
    return createPortal(modalContent, document.body);
}
