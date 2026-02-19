"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ManajemenMateriPaginationProps {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ManajemenMateriPagination({ total, page, totalPages }: ManajemenMateriPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const setPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(newPage));
        router.push(`/dashboard/manajemen-materi?${params.toString()}`);
    };

    if (total === 0) return null;

    return (
        <div className="bg-white px-4 py-3 border-t border-neutral-warm/20 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    type="button"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-neutral-warm/30 text-sm font-medium rounded-md text-text-dark bg-white hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sebelumnya
                </button>
                <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-neutral-warm/30 text-sm font-medium rounded-md text-text-dark bg-white hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed ml-3"
                >
                    Selanjutnya
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-text-dark/70">
                        Halaman <span className="font-medium">{page}</span> dari{" "}
                        <span className="font-medium">{totalPages}</span>
                    </p>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                        type="button"
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-warm/30 bg-white text-sm font-medium text-text-dark/60 hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="sr-only">Sebelumnya</span>
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-neutral-warm/30 bg-white text-sm font-medium text-text-dark">
                        {page}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-warm/30 bg-white text-sm font-medium text-text-dark/60 hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="sr-only">Selanjutnya</span>
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </nav>
            </div>
        </div>
    );
}
