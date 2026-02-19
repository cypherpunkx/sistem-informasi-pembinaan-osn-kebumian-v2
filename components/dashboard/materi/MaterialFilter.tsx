"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import FilterBar, { SELECT_CLASS } from "@/components/dashboard/FilterBar";

interface MaterialFilterProps {
    /** Sembunyikan filter status (untuk halaman Arsip Materi peserta) */
    hideStatus?: boolean;
}

const TOPICS = ["Geology", "Meteorology", "Astronomy", "Oceanography"];

export default function MaterialFilter({ hideStatus = false }: MaterialFilterProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        if (value && value !== "All") params.set(key, value);
        else params.delete(key);
        replace(`${pathname}?${params.toString()}`);
    };

    const handleLimitChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        params.set("limit", value);
        replace(`${pathname}?${params.toString()}`);
    };

    const handleClear = () => replace(pathname);

    return (
        <FilterBar
            basePath={pathname}
            searchPlaceholder="Cari materi..."
            onReset={handleClear}
        >
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-dark/80">Topik</label>
                <select
                    className={SELECT_CLASS}
                    onChange={(e) => handleFilterChange("topic", e.target.value)}
                    value={searchParams.get("topic") ?? "All"}
                >
                    <option value="All">Semua Topik</option>
                    {TOPICS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-dark/80">Tipe</label>
                <select
                    className={SELECT_CLASS}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    value={searchParams.get("type") ?? "All"}
                >
                    <option value="All">Semua Tipe</option>
                    <option value="PDF">PDF</option>
                    <option value="VIDEO">Video</option>
                    <option value="SLIDE">Slide</option>
                    <option value="TEXT">Text</option>
                </select>
            </div>
            {!hideStatus && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-dark/80">Status</label>
                    <select
                        className={SELECT_CLASS}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        value={searchParams.get("status") ?? "All"}
                    >
                        <option value="All">Semua Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
            )}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-dark/80">Per halaman</label>
                <select
                    className={SELECT_CLASS}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    value={searchParams.get("limit") ?? "10"}
                >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </div>
        </FilterBar>
    );
}
