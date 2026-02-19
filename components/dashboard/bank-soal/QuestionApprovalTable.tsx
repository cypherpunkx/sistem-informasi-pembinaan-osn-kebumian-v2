"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { approveQuestion, rejectQuestion } from "@/app/actions/questions";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Question {
    id: number;
    content: string;
    type: string;
    topic: string;
    difficulty: string;
    status: string;
    createdAt: Date | null;
}

interface QuestionApprovalTableProps {
    questions: Question[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}

export default function QuestionApprovalTable({ questions, total, page, totalPages, limit }: QuestionApprovalTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const setApprovalPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", "approval");
        params.set("approvalPage", String(newPage));
        router.push(`/dashboard/bank-soal?${params.toString()}`);
    };
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        const result = await approveQuestion(id);
        if (!result.success) {
            alert(result.message);
        }
        setProcessingId(null);
    };

    const handleReject = async (id: number) => {
        if (!confirm("Are you sure you want to reject this question? It will be moved back to DRAFT.")) return;

        setProcessingId(id);
        const result = await rejectQuestion(id);
        if (!result.success) {
            alert(result.message);
        }
        setProcessingId(null);
    };

    if (questions.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-warm/20 text-center">
                <p className="text-text-dark/60">No questions pending approval.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead className="bg-neutral-light">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Topic</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Preview</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-dark/60 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-warm/20">
                        {questions.map((q) => (
                            <tr key={q.id} className="hover:bg-neutral-warm/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">
                                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                    <span className="font-medium">{q.topic}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                        {q.type.replace("_", " ")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-dark max-w-xs truncate" title={q.content}>
                                    {q.content.length > 50 ? `${q.content.slice(0, 50)}...` : q.content}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleApprove(q.id)}
                                            disabled={processingId === q.id}
                                            className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                            title="Approve & Publish"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(q.id)}
                                            disabled={processingId === q.id}
                                            className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            title="Reject (Return to Draft)"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-neutral-warm/20 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-sm text-text-dark/60">
                        Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setApprovalPage(page - 1)}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>
                        <span className="px-3 py-2 text-sm text-text-dark/70">
                            Halaman {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setApprovalPage(page + 1)}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Selanjutnya <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
