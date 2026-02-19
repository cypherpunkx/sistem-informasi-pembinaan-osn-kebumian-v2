"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter, ChevronDown, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const SELECT_CLASS =
    "px-3 py-2 border border-neutral-warm/40 rounded-lg focus:ring-2 focus:ring-accent-earthy bg-white text-sm text-text-dark min-w-[140px]";

export interface FilterBarProps {
    /** Base URL untuk navigasi (tanpa query), e.g. /dashboard/bank-soal */
    basePath: string;
    /** Placeholder input pencarian */
    searchPlaceholder: string;
    /** Nama param query untuk search (default: search) */
    searchParamKey?: string;
    /** Nama param query untuk halaman, akan di-reset saat filter berubah (default: page) */
    pageParamKey?: string;
    /** Konten panel filter (selects). */
    children: React.ReactNode;
    /** Handler reset (ke basePath). Jika ada, tombol Reset ditampilkan di bawah panel. */
    onReset?: () => void;
}

export default function FilterBar({
    basePath,
    searchPlaceholder,
    searchParamKey = "search",
    pageParamKey = "page",
    children,
    onReset,
}: FilterBarProps) {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [filterOpen, setFilterOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.delete(pageParamKey);
        if (term.trim()) params.set(searchParamKey, term.trim());
        else params.delete(searchParamKey);
        const q = params.toString();
        replace(q ? `${basePath}?${q}` : basePath);
    }, 300);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                panelRef.current?.contains(e.target as Node) ||
                triggerRef.current?.contains(e.target as Node)
            )
                return;
            setFilterOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const activeCount = Array.from(searchParams.entries()).filter(
        ([k, v]) =>
            k !== searchParamKey &&
            k !== pageParamKey &&
            k !== "limit" &&
            v !== "" &&
            v !== "All" &&
            v !== "all"
    ).length;

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-neutral-warm/40 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-dark/50" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-3 py-2 border border-neutral-warm/40 rounded-lg focus:ring-2 focus:ring-accent-earthy focus:border-accent-earthy bg-white"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get(searchParamKey) ?? ""}
                />
            </div>
            <div className="flex items-center gap-2 relative">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setFilterOpen((o) => !o)}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-warm/40 rounded-lg bg-white hover:bg-neutral-light/50 text-text-dark text-sm font-medium transition-colors focus:ring-2 focus:ring-accent-earthy"
                    aria-expanded={filterOpen}
                    aria-haspopup="true"
                >
                    <Filter className="h-4 w-4 text-accent-earthy" />
                    Filter
                    {activeCount > 0 && (
                        <span className="bg-accent-earthy text-white text-xs px-1.5 py-0.5 rounded-full">
                            {activeCount}
                        </span>
                    )}
                    <ChevronDown
                        className={`h-4 w-4 transition-transform ${filterOpen ? "rotate-180" : ""}`}
                    />
                </button>
                {filterOpen && (
                    <div
                        ref={panelRef}
                        className="absolute right-0 top-full mt-2 z-50 min-w-[280px] bg-white rounded-xl shadow-lg border border-neutral-warm/40 p-4 flex flex-col gap-3"
                    >
                        {children}
                        {onReset && (
                            <button
                                type="button"
                                onClick={() => {
                                    onReset();
                                    setFilterOpen(false);
                                }}
                                className="flex items-center justify-center gap-1.5 mt-2 px-3 py-2 border border-neutral-warm/40 rounded-lg bg-neutral-light/50 hover:bg-neutral-warm/20 text-text-dark text-sm font-medium transition-colors"
                                title="Hapus semua filter"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export { SELECT_CLASS };
