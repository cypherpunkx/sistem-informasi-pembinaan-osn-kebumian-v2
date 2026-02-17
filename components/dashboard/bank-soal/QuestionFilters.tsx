"use client";

import { Search, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function QuestionFilters() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        replace(`${window.location.pathname}?${params.toString()}`);
    }, 300);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== 'All') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        replace(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-warm/20 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search questions..."
                    className="block w-full pl-10 pr-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('search')?.toString()}
                />
            </div>
            <div className="flex gap-2">
                <select
                    className="px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy bg-white"
                    onChange={(e) => handleFilterChange('topic', e.target.value)}
                    defaultValue={searchParams.get('topic')?.toString() || 'All'}
                >
                    <option value="All">All Topics</option>
                    <option value="Geology">Geology</option>
                    <option value="Astronomy">Astronomy</option>
                    <option value="Meteorology">Meteorology</option>
                    <option value="Oceanography">Oceanography</option>
                </select>
                <select
                    className="px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy bg-white"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    defaultValue={searchParams.get('type')?.toString() || 'All'}
                >
                    <option value="All">All Types</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="ESSAY">Essay</option>
                </select>
                <select
                    className="px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy bg-white"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    defaultValue={searchParams.get('status')?.toString() || 'All'}
                >
                    <option value="All">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
                <button className="px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light bg-white text-text-dark">
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
