"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { startExamSession, getExamSession, submitExamAnswer, finishExam } from "@/app/actions/exams";

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

    // UI State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // questionId -> answer string
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Load
    useEffect(() => {
        const initExam = async () => {
            try {
                console.log("=== Starting Exam ===");
                console.log("Exam ID:", examId);

                // 1. Start or Resume Session
                const sessionRes = await startExamSession(examId);
                console.log("Session Response:", sessionRes);

                if (!sessionRes.sessionId) {
                    console.error("Failed to start session:", sessionRes.message);
                    alert(sessionRes.message || "Failed to start exam");
                    router.push("/dashboard/latihan-ujian");
                    return;
                }
                setSessionId(sessionRes.sessionId);

                // 2. Fetch Questions & Exam Info
                console.log("Fetching exam session data...");
                const data = await getExamSession(sessionRes.sessionId);
                console.log("Exam Session Data:", data);

                if (!data) {
                    console.error("getExamSession returned null");
                    alert("Failed to load exam data. Please check the console for details.");
                    router.push("/dashboard/latihan-ujian");
                    return;
                }

                setExam(data.exam);
                setQuestions(data.questions as Question[]); // Cast to updated interface

                // Initialize answers from session if any (e.g. resuming)
                // Note: getExamSession logic might need update to return existing answers if we want to support resume
                // For now, assume fresh start or rely on session state if provided

                // Use server-calculated time remaining
                console.log("Exam Duration (minutes):", data.exam.duration);
                console.log("Time Remaining (seconds):", data.timeRemaining);

                setTimeLeft(data.timeRemaining || 0);
                setLoading(false);
            } catch (error) {
                console.error("Error initializing exam:", error);
                alert("An error occurred while loading the exam. Please try again.");
                router.push("/dashboard/latihan-ujian");
            }
        };

        if (examId) initExam();
    }, [examId, router]);

    // Timer
    useEffect(() => {
        if (loading || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading]);

    const formatTime = (seconds: number) => {
        const totalMinutes = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${totalMinutes < 10 ? '0' : ''}${totalMinutes}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswerChange = async (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const saveAnswer = async (questionId: number, value: string) => {
        if (sessionId) {
            await submitExamAnswer(sessionId, questionId, value);
        }
    };

    const handleSubmit = async (auto = false) => {
        if (!sessionId) return;

        if (!auto && !confirm("Are you sure you want to finish the exam?")) return;

        setIsSubmitting(true);
        const res = await finishExam(sessionId);

        if (res.success) {
            router.push(`/dashboard/latihan-ujian/result/${sessionId}`);
        } else {
            alert("Failed to submit exam. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-earthy"></div>
            </div>
        );
    }

    if (!exam || questions.length === 0) return <div>No exam data found.</div>;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 border-b border-neutral-warm/20 flex justify-between items-center bg-neutral-light">
                    <span className="font-bold text-text-dark">Q {currentQuestionIndex + 1}/{questions.length}</span>
                    <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft < 60 ? "text-red-600" : "text-accent-earthy"}`}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <h2 className="text-xl font-bold text-text-dark mb-6">
                        {currentQuestionIndex + 1}. {currentQuestion.content}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options.map((option, idx) => {
                            const isSelected = answers[currentQuestion.id] === option.id.toString();
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        handleAnswerChange(currentQuestion.id, option.id.toString());
                                        saveAnswer(currentQuestion.id, option.id.toString());
                                    }}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 group
                                    ${isSelected
                                            ? "border-accent-earthy bg-accent-earthy/5"
                                            : "border-neutral-warm/30 hover:border-accent-earthy/50"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                     ${isSelected
                                            ? "bg-accent-earthy text-white"
                                            : "bg-neutral-light text-text-dark group-hover:bg-neutral-warm/20"
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-text-dark group-hover:text-black">{option.content}</span>
                                </button>
                            );
                        })}

                        {(currentQuestion.type === "ESSAY" || currentQuestion.type === "SHORT_ANSWER") && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-text-dark/60">Your Answer:</label>
                                <textarea
                                    className="w-full p-4 rounded-lg border border-neutral-warm/30 focus:border-accent-earthy focus:ring-1 focus:ring-accent-earthy min-h-[150px]"
                                    placeholder="Type your answer here..."
                                    value={answers[currentQuestion.id] || ""}
                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                    onBlur={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                                />
                                <p className="text-xs text-text-dark/40">Answer will be saved automatically when you click outside the box.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Footer */}
                <div className="p-4 border-t border-neutral-warm/20 flex justify-between items-center bg-neutral-light/30">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-text-dark hover:bg-neutral-warm/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold shadow-sm"
                        >
                            {isSubmitting ? "Submitting..." : "Finish Exam"} <CheckCircle className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent-earthy text-white hover:bg-text-dark font-bold shadow-sm"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Sidebar / Navigator */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                {/* Timer Card (Desktop) */}
                <div className="hidden lg:block bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 text-center">
                    <p className="text-text-dark/60 text-sm mb-1">Time Remaining</p>
                    <div className={`text-4xl font-mono font-bold flex items-center justify-center gap-3 ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-accent-earthy"}`}>
                        <Clock className="w-8 h-8" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Question Grid */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex-1 flex flex-col">
                    <h3 className="font-bold text-text-dark mb-4">Question Navigator</h3>
                    <div className="grid grid-cols-5 gap-2 content-start">
                        {questions.map((q, idx) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all
                            ${currentQuestionIndex === idx
                                        ? "ring-2 ring-accent-earthy ring-offset-2"
                                        : ""}
                            ${answers[q.id]
                                        ? "bg-accent-earthy text-white"
                                        : "bg-neutral-light text-text-dark hover:bg-neutral-warm/30"}
                        `}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 text-xs text-text-dark/60 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-accent-earthy"></div>
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-neutral-light border border-neutral-warm/20"></div>
                            <span>Not Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-md ring-2 ring-accent-earthy"></div>
                            <span>Current</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
