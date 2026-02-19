"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExamPaginationProps {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ExamPagination({ total, page, limit, totalPages }: ExamPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const setPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(newPage));
        router.push(`/dashboard/manajemen-ujian?${params.toString()}`);
    };

    if (total === 0 || totalPages <= 1) return null;

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-warm/20">
            <p className="text-sm text-text-dark/60">
                Menampilkan {start}–{end} dari {total} ujian
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Sebelumnya
                </button>
                <span className="px-3 py-2 text-sm text-text-dark/70">
                    Halaman {page} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
