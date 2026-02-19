"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterBar, { SELECT_CLASS } from "@/components/dashboard/FilterBar";
import { getDistinctExamCategories } from "@/app/actions/exams";

const BASE_PATH = "/dashboard/manajemen-ujian";

export default function ExamFilters() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        getDistinctExamCategories().then(setCategories);
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (value && value !== "All" && value !== "all") params.set(key, value);
        else params.delete(key);
        replace(`${BASE_PATH}?${params.toString()}`);
    };

    const handleClear = () => replace(BASE_PATH);

    return (
        <FilterBar
            basePath={BASE_PATH}
            searchPlaceholder="Cari judul ujian..."
            onReset={handleClear}
        >
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-dark/80">Tipe</label>
                <select
                    className={SELECT_CLASS}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    value={searchParams.get("type") ?? "All"}
                >
                    <option value="All">Semua Tipe</option>
                    <option value="FIXED">Standar</option>
                    <option value="DYNAMIC">Adaptif</option>
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-dark/80">Kategori</label>
                <select
                    className={SELECT_CLASS}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    value={searchParams.get("category") ?? "All"}
                >
                    <option value="All">Semua Kategori</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-dark/80">Status</label>
                <select
                    className={SELECT_CLASS}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    value={searchParams.get("status") ?? "all"}
                >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                </select>
            </div>
        </FilterBar>
    );
}
