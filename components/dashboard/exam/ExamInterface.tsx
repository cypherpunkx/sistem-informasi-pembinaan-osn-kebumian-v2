"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Flag,
    AlertTriangle,
    Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startExamSession, getExamSession, submitExamAnswer, finishExam } from "@/app/actions/exams";
import { setActiveExamCookie, clearActiveExamCookie } from "@/app/actions/exam-cookie";

interface ExamInterfaceProps {
    examId: number;
}

interface Question {
    id: number;
    content: string;
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
    options: { id: number; content: string }[];
}

interface ExamData {
    id: number;
    title: string;
    duration: number;
}

export default function ExamInterface({ examId }: ExamInterfaceProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
    const [errorModal, setErrorModal] = useState<{ message: string } | null>(null);
    const timeExpiredSubmittedRef = useRef(false);

    const handleErrorModalClose = useCallback(() => {
        setErrorModal(null);
        router.push("/dashboard/latihan-ujian");
    }, [router]);

    useEffect(() => {
        const initExam = async () => {
            try {
                const sessionRes = await startExamSession(examId);
                if (!sessionRes.sessionId) {
                    setErrorModal({ message: sessionRes.message || "Gagal memulai ujian" });
                    setLoading(false);
                    return;
                }
                setSessionId(sessionRes.sessionId);
                await setActiveExamCookie(examId);

                const data = await getExamSession(sessionRes.sessionId);
                if (!data) {
                    setErrorModal({ message: "Gagal memuat data ujian." });
                    setLoading(false);
                    return;
                }

                setExam(data.exam);
                setQuestions((data.questions || []) as Question[]);

                const remaining = data.timeRemaining ?? 0;
                setTimeLeft(remaining);
                if (remaining <= 0) {
                    await finishExam(sessionRes.sessionId);
                    await clearActiveExamCookie();
                    router.push(`/dashboard/latihan-ujian/result/${sessionRes.sessionId}`);
                    return;
                }
                setLoading(false);
            } catch (error) {
                console.error("Error initializing exam:", error);
                setErrorModal({ message: "Terjadi kesalahan. Silakan coba lagi." });
                setLoading(false);
            }
        };

        if (examId && examId > 0) initExam();
        else if (!examId || examId <= 0) router.push("/dashboard/latihan-ujian");
    }, [examId, router]);

    useEffect(() => {
        if (loading || !sessionId || isSubmitting) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        const handlePopState = (e: PopStateEvent) => {
            if (e.state?.exam === true) return;
            window.history.forward();
            setShowLeaveConfirm(true);
        };

        window.history.pushState({ exam: true }, "", window.location.href);
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [loading, sessionId, isSubmitting, router]);

    const handleLeaveConfirm = useCallback(async () => {
        if (!sessionId) return;
        setIsLeaveSubmitting(true);
        const res = await finishExam(sessionId);
        if (res.success) {
            await clearActiveExamCookie();
            setShowLeaveConfirm(false);
            router.push(`/dashboard/latihan-ujian/result/${sessionId}`);
        } else {
            setIsLeaveSubmitting(false);
            alert(res.message || "Gagal mengirim ujian. Silakan coba lagi.");
        }
    }, [sessionId, router]);

    const doSubmit = useCallback(async () => {
        if (!sessionId) return;
        setIsSubmitting(true);
        const res = await finishExam(sessionId);

        if (res.success) {
            await clearActiveExamCookie();
            router.push(`/dashboard/latihan-ujian/result/${sessionId}`);
        } else {
            alert("Gagal mengirim ujian. Silakan coba lagi.");
            setIsSubmitting(false);
        }
    }, [sessionId, router]);

    useEffect(() => {
        if (loading || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, doSubmit]);

    useEffect(() => {
        if (loading || timeLeft !== 0 || !sessionId || timeExpiredSubmittedRef.current) return;
        timeExpiredSubmittedRef.current = true;
        void doSubmit();
    }, [loading, timeLeft, sessionId, doSubmit]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const saveAnswer = useCallback(
        async (questionId: number, value: string) => {
            if (!sessionId) return;
            await submitExamAnswer(sessionId, questionId, value);
            setLastSavedAt(new Date());
        },
        [sessionId]
    );

    const handleSubmit = useCallback(
        (auto = false) => {
            if (!sessionId) return;

            if (!auto) {
                setShowReviewModal(true);
                return;
            }
            void doSubmit();
        },
        [sessionId, doSubmit]
    );

    const handleConfirmSubmit = useCallback(() => {
        setShowReviewModal(false);
        doSubmit();
    }, [doSubmit]);

    const toggleMarkForReview = (questionId: number) => {
        setMarkedForReview((prev) => {
            const next = new Set(prev);
            if (next.has(questionId)) next.delete(questionId);
            else next.add(questionId);
            return next;
        });
    };

    if (errorModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-light/80">
                <div
                    className="bg-white rounded-2xl shadow-xl border border-neutral-warm/20 max-w-md w-full overflow-hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="exam-error-title"
                    aria-describedby="exam-error-desc"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 text-center sm:text-left">
                        <div className="flex justify-center sm:justify-start">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 shrink-0">
                                <Info className="w-6 h-6" aria-hidden />
                            </div>
                        </div>
                        <h2 id="exam-error-title" className="mt-4 text-lg font-bold text-text-dark">
                            Tidak Dapat Memulai Ujian
                        </h2>
                        <p id="exam-error-desc" className="mt-2 text-sm text-text-dark/80 leading-relaxed">
                            {errorModal.message}
                        </p>
                    </div>
                    <div className="px-6 py-4 border-t border-neutral-warm/20 bg-neutral-light/20 flex justify-end">
                        <button
                            type="button"
                            onClick={handleErrorModalClose}
                            className="px-5 py-2.5 rounded-xl bg-accent-earthy text-white font-semibold hover:bg-accent-earthy/90 transition-colors shadow-sm"
                        >
                            Kembali ke Daftar Ujian
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-earthy" />
            </div>
        );
    }

    if (!exam || questions.length === 0) {
        return (
            <div className="flex h-96 items-center justify-center text-text-dark/60">
                Tidak ada data ujian.
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
    const unansweredCount = questions.length - answeredCount;

    const timerMinutes = Math.floor(timeLeft / 60);
    const timerColor =
        timeLeft < 60
            ? "text-red-600"
            : timerMinutes < 5
              ? "text-amber-600"
              : "text-accent-earthy";
    const timerPulse = timeLeft < 60 ? "animate-pulse" : "";

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)] min-h-[500px]">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                {/* Sticky Timer Bar */}
                <div
                    className={`flex items-center justify-between px-4 lg:px-6 py-4 bg-white border-b border-neutral-warm/20 ${timerPulse}`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-base font-medium text-text-dark">
                            Soal {currentQuestionIndex + 1} / {questions.length}
                        </span>
                        <div className={`flex items-center gap-2 font-mono text-xl lg:text-2xl font-bold ${timerColor}`}>
                            <Clock className="w-5 h-5" aria-hidden />
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastSavedAt && (
                            <span className="text-sm text-green-600 flex items-center gap-1" role="status">
                                <CheckCircle className="w-4 h-4" />
                                Tersimpan
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <h2
                        className="text-lg lg:text-xl font-bold text-text-dark mb-8 leading-relaxed"
                        style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
                    >
                        {currentQuestionIndex + 1}. {currentQuestion.content}
                    </h2>

                    <div className="space-y-4">
                        {currentQuestion.type === "MULTIPLE_CHOICE" &&
                            currentQuestion.options.map((option, idx) => {
                                const isSelected =
                                    answers[currentQuestion.id] === option.id.toString();
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            handleAnswerChange(currentQuestion.id, option.id.toString());
                                            saveAnswer(currentQuestion.id, option.id.toString());
                                        }}
                                        className={`w-full text-left p-5 rounded-xl border-2 flex items-center gap-4 transition-all duration-200 hover:border-accent-earthy/50
                                            ${isSelected
                                                ? "border-accent-earthy bg-accent-earthy/5 ring-1 ring-accent-earthy/20"
                                                : "border-neutral-warm/30 bg-white"
                                            }`}
                                        aria-pressed={isSelected}
                                        aria-label={`Opsi ${String.fromCharCode(65 + idx)}: ${option.content.slice(0, 50)}`}
                                    >
                                        <div
                                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-colors duration-200
                                                ${isSelected
                                                    ? "bg-accent-earthy text-white"
                                                    : "bg-neutral-light text-text-dark"
                                                }`}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className="text-base text-text-dark flex-1">
                                            {option.content}
                                        </span>
                                    </button>
                                );
                            })}

                        {(currentQuestion.type === "ESSAY" ||
                            currentQuestion.type === "SHORT_ANSWER") && (
                            <div className="space-y-3">
                                <label
                                    htmlFor={`answer-${currentQuestion.id}`}
                                    className="block text-sm font-medium text-text-dark/70"
                                >
                                    Jawaban Anda:
                                </label>
                                <textarea
                                    id={`answer-${currentQuestion.id}`}
                                    className="w-full p-4 rounded-xl border-2 border-neutral-warm/30 focus:border-accent-earthy focus:ring-2 focus:ring-accent-earthy/20 min-h-[180px] text-base leading-relaxed transition-all duration-200 bg-white text-text-dark placeholder:text-text-dark/50"
                                    placeholder="Ketik jawaban Anda di sini..."
                                    value={answers[currentQuestion.id] || ""}
                                    onChange={(e) =>
                                        handleAnswerChange(currentQuestion.id, e.target.value)
                                    }
                                    onBlur={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                                    aria-describedby={`hint-${currentQuestion.id}`}
                                />
                                <p
                                    id={`hint-${currentQuestion.id}`}
                                    className="text-sm text-text-dark/50"
                                >
                                    Tersimpan otomatis saat Anda mengklik di luar kotak.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Footer */}
                <div className="p-4 lg:p-6 border-t border-neutral-warm/20 flex flex-wrap justify-between items-center gap-4 bg-neutral-light/30">
                    <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-text-dark hover:bg-neutral-warm/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        aria-label="Soal sebelumnya"
                    >
                        <ChevronLeft className="w-5 h-5" /> Sebelumnya
                    </button>

                    <button
                        type="button"
                        onClick={() => toggleMarkForReview(currentQuestion.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                            ${markedForReview.has(currentQuestion.id)
                                ? "bg-amber-100 text-amber-800 border-2 border-amber-400"
                                : "text-text-dark/70 hover:bg-neutral-warm/10 border-2 border-transparent"
                            }`}
                        aria-pressed={markedForReview.has(currentQuestion.id)}
                        aria-label={
                            markedForReview.has(currentQuestion.id)
                                ? "Hapus tandai untuk review"
                                : "Tandai untuk review"
                        }
                    >
                        <Flag className="w-4 h-4" />
                        {markedForReview.has(currentQuestion.id) ? "Batalkan Tandai" : "Tandai untuk Review"}
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold shadow-sm disabled:opacity-70 transition-all duration-200"
                        >
                            {isSubmitting ? "Mengirim..." : "Kumpulkan Ujian"}
                            <CheckCircle className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentQuestionIndex((p) =>
                                    Math.min(questions.length - 1, p + 1)
                                )
                            }
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-earthy text-white hover:bg-text-dark font-bold shadow-sm transition-all duration-200"
                            aria-label="Soal berikutnya"
                        >
                            Selanjutnya <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Question Navigator Panel */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h3 className="font-bold text-text-dark mb-4 text-base">Navigator Soal</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = !!answers[q.id]?.trim();
                            const isMarked = markedForReview.has(q.id);
                            const isCurrent = currentQuestionIndex === idx;

                            let bg = "bg-neutral-100 text-text-dark border border-neutral-warm/20";
                            if (isCurrent) bg = "ring-2 ring-accent-earthy ring-offset-2 bg-white";
                            if (isAnswered && !isMarked) bg = "bg-accent-earthy text-white border-transparent";
                            if (isMarked && isAnswered) bg = "bg-amber-500 text-white border-transparent";
                            if (isMarked && !isAnswered) bg = "bg-amber-400 text-white border-transparent";

                            return (
                                <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200 hover:scale-105 ${bg}`}
                                    aria-current={isCurrent ? "step" : undefined}
                                    aria-label={`Soal ${idx + 1}${isAnswered ? ", sudah dijawab" : ""}${isMarked ? ", ditandai" : ""}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-warm/20 space-y-2 text-sm text-text-dark/70">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-accent-earthy" />
                            <span>Dijawab</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-400" />
                            <span>Ditandai</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border-2 border-neutral-warm/40 bg-white" />
                            <span>Belum dijawab</span>
                        </div>
                    </div>
                </div>

                {/* Review Summary - shown when modal would appear */}
                <div className="bg-white p-4 rounded-xl border border-neutral-warm/20 text-sm">
                    <p className="font-medium text-text-dark mb-2">Ringkasan</p>
                    <p>
                        Dijawab: <span className="font-bold text-green-600">{answeredCount}</span>
                    </p>
                    <p>
                        Belum: <span className="font-bold text-amber-600">{unansweredCount}</span>
                    </p>
                    <p>
                        Ditandai:{" "}
                        <span className="font-bold text-amber-700">{markedForReview.size}</span>
                    </p>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-labelledby="review-title"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
                        <h2 id="review-title" className="text-lg font-bold text-text-dark flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" aria-hidden />
                            Review Sebelum Kumpul
                        </h2>
                        <p className="text-text-dark/80 text-sm">Anda akan mengumpulkan ujian.</p>

                        <div className="border-t border-b border-neutral-warm/30 py-4 space-y-4">
                            <p className="text-sm text-text-dark/70">Total Soal: {questions.length}</p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs text-text-dark/70">Sudah dijawab</span>
                                    <span className="text-[20px] font-bold text-green-600 tabular-nums">{answeredCount}</span>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs text-text-dark/70">Belum dijawab</span>
                                    <span className="text-[20px] font-bold text-text-dark tabular-nums">{unansweredCount}</span>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs text-text-dark/70">Ditandai untuk review</span>
                                    <span className="text-[20px] font-bold text-text-dark tabular-nums">{markedForReview.size}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-text-dark/70">Progress</span>
                                <div className="h-2 rounded-full bg-neutral-warm/30 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-green-600 transition-all"
                                        style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
                                        role="progressbar"
                                        aria-valuenow={answeredCount}
                                        aria-valuemin={0}
                                        aria-valuemax={questions.length}
                                    />
                                </div>
                                <p className="text-xs text-text-dark/60 tabular-nums">{answeredCount} / {questions.length}</p>
                            </div>
                        </div>

                        {unansweredCount > 0 ? (
                            <p className="text-sm text-red-600 font-medium flex items-center gap-2" role="alert">
                                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                                {unansweredCount} soal belum dijawab akan dianggap kosong.
                            </p>
                        ) : (
                            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
                                Semua soal telah dijawab.
                            </p>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-neutral-warm/40 bg-white text-text-dark font-medium hover:bg-neutral-light transition-colors"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                            >
                                Kumpulkan Ujian
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Konfirmasi keluar = submit + redirect ke result */}
            {showLeaveConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-labelledby="leave-exam-title"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h2 id="leave-exam-title" className="text-lg font-bold text-text-dark flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            Keluar dan Kumpulkan Ujian?
                        </h2>
                        <p className="text-text-dark/80 text-sm">
                            Jika Anda keluar sekarang, ujian akan langsung dikumpulkan dan tidak dapat dilanjutkan kembali.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isLeaveSubmitting}
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 py-2.5 rounded-lg border border-neutral-warm/40 bg-white text-text-dark font-medium hover:bg-neutral-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isLeaveSubmitting}
                                onClick={() => void handleLeaveConfirm()}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLeaveSubmitting ? (
                                    <>
                                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Mengumpulkan…
                                    </>
                                ) : (
                                    "Keluar & Kumpulkan"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
