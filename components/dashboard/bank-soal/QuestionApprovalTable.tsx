"use client";

import { useState } from "react";
import { approveQuestion, rejectQuestion } from "@/app/actions/questions";
import { Check, X, Eye } from "lucide-react";

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
}

export default function QuestionApprovalTable({ questions }: QuestionApprovalTableProps) {
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
                                <td className="px-6 py-4 text-sm text-text-dark max-w-xs truncate">
                                    {q.content.substring(0, 50)}...
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
        </div>
    );
}
