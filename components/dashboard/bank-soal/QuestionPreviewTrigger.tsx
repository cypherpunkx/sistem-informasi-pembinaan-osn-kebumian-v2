"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, X, Loader2, CheckCircle, Pencil } from "lucide-react";
import { getQuestionById } from "@/app/actions/questions";

interface QuestionPreviewTriggerProps {
    questionId: number;
    /** Tampilkan tombol aksi (Edit Soal) di bawah preview. Default true. */
    showActions?: boolean;
}

export default function QuestionPreviewTrigger({ questionId, showActions = true }: QuestionPreviewTriggerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState<Awaited<ReturnType<typeof getQuestionById>>>(null);

    const handleOpen = async () => {
        setOpen(true);
        setLoading(true);
        setQuestion(null);
        try {
            const q = await getQuestionById(questionId);
            setQuestion(q);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="text-text-dark/60 hover:text-accent-earthy"
                title="Preview"
            >
                <Eye className="w-4 h-4" />
            </button>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-lg border border-neutral-warm/20 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-warm/20 shrink-0">
                            <h2 className="text-lg font-bold text-text-dark">Preview Soal</h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1 rounded hover:bg-neutral-light text-text-dark/70"
                                aria-label="Tutup"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 min-h-0">
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-accent-earthy" />
                                </div>
                            )}
                            {!loading && !question && (
                                <p className="text-text-dark/60 py-8 text-center">Soal tidak ditemukan.</p>
                            )}
                            {!loading && question && (
                                <div className="space-y-5 text-sm">
                                    <div>
                                        <span className="text-xs font-semibold text-text-dark/50 uppercase tracking-wide">Konten</span>
                                        <p className="mt-2 text-base font-medium text-text-dark leading-relaxed whitespace-pre-wrap">
                                            {question.content}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 rounded bg-neutral-100 text-text-dark/80 text-xs">
                                            {question.type.replace("_", " ")}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-neutral-100 text-text-dark/80 text-xs">
                                            {question.topic}
                                            {question.subtopic ? ` / ${question.subtopic}` : ""}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-neutral-100 text-text-dark/80 text-xs">
                                            {question.difficulty}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-neutral-100 text-text-dark/80 text-xs">
                                            {question.status}
                                        </span>
                                    </div>
                                    {question.type === "MULTIPLE_CHOICE" && question.options && question.options.length > 0 && (
                                        <div>
                                            <span className="text-xs font-semibold text-text-dark/50 uppercase tracking-wide">Opsi</span>
                                            <ul className="mt-2 space-y-2 list-none pl-0">
                                                {(question.options as { content?: string; isCorrect?: boolean }[]).map((opt, i) => (
                                                    <li
                                                        key={i}
                                                        className={`flex items-start gap-2 rounded-lg border p-3 transition-colors
                                                            ${opt.isCorrect
                                                                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                                                : "bg-gray-50/80 border-neutral-warm/20 text-text-dark/90"
                                                            }`}
                                                    >
                                                        {opt.isCorrect ? (
                                                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                                                        ) : (
                                                            <span className="w-5 h-5 shrink-0 mt-0.5 rounded-full border-2 border-neutral-300" aria-hidden />
                                                        )}
                                                        <span className="flex-1">{(opt?.content ?? "") as ReactNode}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {question.type === "SHORT_ANSWER" && question.answerKeys && Array.isArray(question.answerKeys)
                                        ? (() => {
                                            const keys = question.answerKeys as Array<{ key: string }>;
                                            return (
                                                <div>
                                                    <span className="text-xs font-semibold text-text-dark/50 uppercase tracking-wide">Kunci jawaban</span>
                                                    <ul className="mt-2 space-y-1 list-disc list-inside text-text-dark/80">
                                                        {keys.map((k, i) => (
                                                            <li key={i}>{k.key}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })()
                                        : null}
                                    {question.type === "ESSAY" && question.rubric && Array.isArray(question.rubric)
                                        ? (() => {
                                            const rubric = question.rubric as { component: string; keywords?: string[] | string; points: number }[];
                                            return (
                                                <div>
                                                    <span className="text-xs font-semibold text-text-dark/50 uppercase tracking-wide">Rubrik</span>
                                                    <ul className="mt-2 space-y-2">
                                                        {rubric.map((r, i) => (
                                                            <li key={i} className="border-l-2 border-neutral-warm/30 pl-2 text-text-dark/80">
                                                                {r.component} — {r.points} poin
                                                                {r.keywords != null && r.keywords !== ""
                                                                    ? ` (${Array.isArray(r.keywords) ? r.keywords.join(", ") : r.keywords})`
                                                                    : ""}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })()
                                        : null}
                                    {question.explanation && (
                                        <div className="rounded-lg bg-neutral-light/50 border border-neutral-warm/20 p-4">
                                            <span className="text-xs font-semibold text-text-dark/50 uppercase tracking-wide">Penjelasan</span>
                                            <p className="mt-2 text-text-dark/80 whitespace-pre-wrap leading-relaxed">
                                                {question.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {!loading && question && showActions && (
                            <div className="p-4 border-t border-neutral-warm/20 bg-gray-50/50 flex flex-wrap items-center justify-end gap-2 shrink-0">
                                <Link
                                    href={`/dashboard/bank-soal/edit/${questionId}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent-earthy rounded-lg hover:opacity-90 transition-opacity"
                                    onClick={() => setOpen(false)}
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Soal
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-text-dark border border-neutral-warm/40 rounded-lg hover:bg-neutral-light transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
