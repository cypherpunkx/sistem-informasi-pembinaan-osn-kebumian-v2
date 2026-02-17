"use client";

import { Search } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function MaterialFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "All") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search materials..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy/20"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get("search")?.toString()}
                />
            </div>
            <div className="flex gap-2">
                <select
                    className="px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white text-sm"
                    onChange={(e) => handleFilterChange("topic", e.target.value)}
                    defaultValue={searchParams.get("topic")?.toString()}
                >
                    <option value="All">All Topics</option>
                    <option value="Geology">Geology</option>
                    <option value="Meteorology">Meteorology</option>
                    <option value="Astronomy">Astronomy</option>
                    <option value="Oceanography">Oceanography</option>
                </select>
                <select
                    className="px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white text-sm"
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    defaultValue={searchParams.get("type")?.toString()}
                >
                    <option value="All">All Types</option>
                    <option value="PDF">PDF</option>
                    <option value="VIDEO">Video</option>
                    <option value="SLIDE">Slide</option>
                    <option value="TEXT">Text</option>
                </select>
                <select
                    className="px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white text-sm"
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    defaultValue={searchParams.get("status")?.toString()}
                >
                    <option value="All">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>
        </div>
    );
}
