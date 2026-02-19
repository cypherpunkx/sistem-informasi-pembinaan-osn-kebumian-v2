"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateMaterialStatus } from "@/app/actions/materials";
import MaterialPreviewTrigger from "./MaterialPreviewTrigger";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Material {
    id: number;
    title: string;
    url: string | null;
    topic: string;
    type: string;
    status: string;
    createdAt: Date | null;
}

interface MaterialApprovalTableProps {
    materials: Material[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}

export default function MaterialApprovalTable({
    materials,
    total,
    page,
    totalPages,
    limit,
}: MaterialApprovalTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const setApprovalPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", "approval");
        params.set("approvalPage", String(newPage));
        router.push(`/dashboard/manajemen-materi?${params.toString()}`);
    };

    const handleApprove = async (id: number) => {
        setProcessingId(id);
        const result = await updateMaterialStatus(id, "PUBLISHED");
        if (!result.success) {
            alert(result.message);
        } else {
            router.refresh();
        }
        setProcessingId(null);
    };

    const handleReject = async (id: number) => {
        if (!confirm("Tolak materi ini? Status akan dikembalikan ke DRAFT.")) return;
        setProcessingId(id);
        const result = await updateMaterialStatus(id, "DRAFT");
        if (!result.success) {
            alert(result.message);
        } else {
            router.refresh();
        }
        setProcessingId(null);
    };

    if (materials.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-warm/20 text-center">
                <p className="text-text-dark/60">Tidak ada materi yang menunggu persetujuan.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead className="bg-neutral-light">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Judul</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Topik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Tipe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Preview</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-text-dark/60 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-warm/20">
                        {materials.map((m) => (
                            <tr key={m.id} className="hover:bg-neutral-warm/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">
                                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-dark max-w-xs">
                                    <div className="font-medium truncate" title={m.title}>{m.title}</div>
                                    {m.url && <div className="text-xs text-text-dark/50 truncate max-w-xs">{m.url}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">{m.topic}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                        {m.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <MaterialPreviewTrigger materialId={m.id} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(m.id)}
                                            disabled={processingId === m.id}
                                            className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                            title="Setujui & Publish"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleReject(m.id)}
                                            disabled={processingId === m.id}
                                            className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            title="Tolak (kembalikan ke DRAFT)"
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
