"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, XCircle, Loader2, FileText, Calendar, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { getExamSessionDetail } from "@/app/actions/nilai";
import FeedbackForm from "./FeedbackForm";

interface ExamSessionDetailProps {
    sessionId: number;
    onClose: () => void;
    onFeedbackSaved?: () => void;
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

function getScoreColor(score: number | null) {
    if (score === null) return "text-text-dark/60";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
}

function getScoreBadgeClass(score: number | null) {
    if (score === null) return "bg-neutral-100 text-neutral-600";
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
}

export default function ExamSessionDetail({ sessionId, onClose, onFeedbackSaved }: ExamSessionDetailProps) {
    const [detail, setDetail] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [questionPage, setQuestionPage] = useState(1);
    const overlayRef = useRef<HTMLDivElement>(null);

    const QUESTIONS_PER_PAGE = 10;
    const totalQuestions = detail?.results?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalQuestions / QUESTIONS_PER_PAGE));
    const paginatedResults = detail?.results
        ? detail.results.slice(
            (questionPage - 1) * QUESTIONS_PER_PAGE,
            questionPage * QUESTIONS_PER_PAGE
        )
        : [];

    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        queueMicrotask(() => setMounted(true));
        return () => {
            setMounted(false);
        };
    }, []);

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            const data = await getExamSessionDetail(sessionId);
            setDetail(data);
            setQuestionPage(1);
            setLoading(false);
        }
        fetchDetail();
    }, [sessionId]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (mounted) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [mounted, onClose]);

    useEffect(() => {
        if (!loading && detail && closeButtonRef.current) {
            closeButtonRef.current.focus({ preventScroll: true });
        }
    }, [loading, detail]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleFeedbackSuccess = async () => {
        const data = await getExamSessionDetail(sessionId);
        setDetail(data);
        setShowFeedbackForm(false);
        onFeedbackSaved?.();
    };

    if (!mounted) return null;

    const modalContent = loading ? (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent-earthy" aria-hidden />
                <p id="modal-title" className="text-sm font-medium text-text-dark/70">
                    Memuat detail sesi...
                </p>
            </div>
        </div>
    ) : !detail ? (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
                <p className="text-red-600 font-medium">Gagal memuat detail sesi.</p>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    Tutup
                </button>
            </div>
        </div>
    ) : (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8 flex flex-col h-[90vh] max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-6 border-b border-neutral-warm/20 shrink-0">
                    <div className="min-w-0">
                        <h2 id="detail-title" className="text-xl font-bold text-text-dark truncate">
                            Detail Sesi Ujian
                        </h2>
                        <p className="text-sm text-text-dark/60 mt-1 truncate">
                            {detail.student.name || detail.student.email} · {detail.exam.title}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-lg font-bold ${getScoreBadgeClass(
                                detail.session.score
                            )}`}
                        >
                            <Award className="w-5 h-5" />
                            {detail.session.score ?? "—"}
                        </span>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-neutral-light text-text-dark transition-colors focus:outline-none focus:ring-2 focus:ring-accent-earthy focus:ring-offset-2"
                            aria-label="Tutup"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b border-neutral-warm/20 shrink-0">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-light/40">
                        <div className="p-2 rounded-lg bg-white shadow-sm">
                            <Award className={`w-5 h-5 ${getScoreColor(detail.session.score)}`} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/50 uppercase tracking-wide">Skor</p>
                            <p className={`text-lg font-bold ${getScoreColor(detail.session.score)}`}>
                                {detail.session.score ?? "—"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-light/40">
                        <div className="p-2 rounded-lg bg-white shadow-sm">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/50 uppercase tracking-wide">Benar</p>
                            <p className="text-lg font-bold text-text-dark">
                                {detail.session.correctAnswers}/{detail.session.totalQuestions}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-light/40">
                        <div className="p-2 rounded-lg bg-white shadow-sm">
                            <Calendar className="w-5 h-5 text-text-dark/60" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/50 uppercase tracking-wide">Selesai</p>
                            <p className="text-sm font-semibold text-text-dark">
                                {detail.session.endTime
                                    ? new Date(detail.session.endTime).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "—"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-light/40">
                        <div className="p-2 rounded-lg bg-white shadow-sm">
                            <FileText className="w-5 h-5 text-text-dark/60" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-text-dark/50 uppercase tracking-wide">Kategori</p>
                            <p className="text-sm font-semibold text-text-dark truncate">
                                {detail.exam.category || "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Question breakdown - scrollable, dengan pagination jika > 10 soal */}
                <div className="flex-1 min-h-[320px] max-h-[65vh] overflow-hidden flex flex-col shrink-0">
                    <div className="px-6 py-3 border-b border-neutral-warm/20 bg-white shrink-0 flex items-center justify-between gap-4 flex-wrap">
                        <h3 className="text-base font-bold text-text-dark">Ringkasan per Soal</h3>
                        {totalQuestions > QUESTIONS_PER_PAGE && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setQuestionPage((p) => Math.max(1, p - 1))}
                                    disabled={questionPage <= 1}
                                    className="p-2 rounded-lg border border-neutral-warm/30 text-text-dark hover:bg-neutral-light/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Halaman sebelumnya"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-text-dark/70 whitespace-nowrap">
                                    Soal {(questionPage - 1) * QUESTIONS_PER_PAGE + 1}–{Math.min(questionPage * QUESTIONS_PER_PAGE, totalQuestions)} dari {totalQuestions}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuestionPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={questionPage >= totalPages}
                                    className="p-2 rounded-lg border border-neutral-warm/30 text-text-dark hover:bg-neutral-light/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Halaman berikutnya"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[280px]">
                        {paginatedResults.map((result) => (
                            <div
                                key={result.id}
                                className={`rounded-xl border-2 p-4 ${
                                    result.isCorrect
                                        ? "border-green-200 bg-green-50/50"
                                        : "border-red-200 bg-red-50/50"
                                }`}
                            >
                                <div className="flex gap-3">
                                    <span className="shrink-0 mt-0.5">
                                        {result.isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" aria-hidden />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" aria-hidden />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="font-bold text-text-dark">Soal {result.questionNumber}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 text-text-dark/60">
                                                {result.difficulty}
                                            </span>
                                            {result.topic && (
                                                <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 text-text-dark/60">
                                                    {result.topic}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text-dark mb-3 leading-relaxed">{result.content}</p>

                                        {result.type === "MULTIPLE_CHOICE" && result.options?.length > 0 && (
                                            <div className="space-y-2">
                                                {result.options.map((option) => {
                                                    const isUserAnswer = option.id === parseInt(result.userAnswer || "", 10);
                                                    const isCorrectAnswer = option.isCorrect;
                                                    return (
                                                        <div
                                                            key={option.id}
                                                            className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${
                                                                isCorrectAnswer
                                                                    ? "border-green-300 bg-green-100/80 font-medium"
                                                                    : isUserAnswer
                                                                        ? "border-red-300 bg-red-100/80"
                                                                        : "border-neutral-warm/20 bg-white"
                                                            }`}
                                                        >
                                                            {isCorrectAnswer && (
                                                                <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                                                            )}
                                                            {isUserAnswer && !isCorrectAnswer && (
                                                                <XCircle className="w-4 h-4 shrink-0 text-red-600" />
                                                            )}
                                                            <span className="wrap-break-word">{option.content}</span>
                                                            {isUserAnswer && (
                                                                <span className="ml-auto text-xs font-medium text-text-dark/60 shrink-0">
                                                                    Jawaban kamu
                                                                </span>
                                                            )}
                                                            {isCorrectAnswer && !isUserAnswer && (
                                                                <span className="ml-auto text-xs font-medium text-green-700 shrink-0">
                                                                    Jawaban benar
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {(result.type === "SHORT_ANSWER" || result.type === "ESSAY") && (
                                            <div className="space-y-2">
                                                {result.userAnswer && (
                                                    <div className="rounded-lg border border-neutral-warm/30 bg-white p-3">
                                                        <p className="text-xs font-semibold text-text-dark/60 mb-1">
                                                            Jawaban peserta
                                                        </p>
                                                        <p className="text-sm text-text-dark whitespace-pre-wrap">
                                                            {result.userAnswer}
                                                        </p>
                                                    </div>
                                                )}
                                                {result.correctAnswerContent && (
                                                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                                                        <p className="text-xs font-semibold text-green-800 mb-1">
                                                            Kunci / referensi
                                                        </p>
                                                        <p className="text-sm text-green-900 whitespace-pre-wrap">
                                                            {result.correctAnswerContent}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {result.explanation && (
                                            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                                                <p className="text-xs font-semibold text-blue-800 mb-1">Penjelasan</p>
                                                <p className="text-sm text-blue-900 leading-relaxed">{result.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feedback - dalam card, tombol dan teks tidak terpotong */}
                <div className="p-6 border-t border-neutral-warm/20 shrink-0">
                    <div className="rounded-xl border border-neutral-warm/20 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-neutral-warm/10">
                            <h3 className="text-base font-bold text-text-dark">Feedback</h3>
                        </div>
                        <div className="p-5">
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
                                        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-neutral-warm/20 bg-neutral-light/30 p-4 mb-4">
                                            <p className="text-sm text-text-dark whitespace-pre-wrap leading-relaxed">
                                                {detail.session.feedback}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-dark/50 italic mb-4">Belum ada feedback.</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowFeedbackForm(true)}
                                        className="px-4 py-2.5 bg-accent-earthy text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent-earthy focus:ring-offset-2"
                                    >
                                        {detail.session.feedback ? "Edit feedback" : "Tambah feedback"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-warm/20 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-neutral-warm/30 text-text-dark font-medium hover:bg-neutral-light/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-earthy focus:ring-offset-2"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
