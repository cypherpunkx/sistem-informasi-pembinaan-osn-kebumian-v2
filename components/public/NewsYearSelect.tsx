"use client";

import { useRouter } from "next/navigation";

type Props = {
    years: number[];
    currentYear: number | null;
    category: string;
};

export default function NewsYearSelect({ years, currentYear, category }: Props) {
    const router = useRouter();
    const options = years.length > 0 ? years : [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.currentTarget.value;
        const params = new URLSearchParams();
        if (v) params.set("year", v);
        if (category) params.set("category", category);
        router.push(params.toString() ? `/news?${params.toString()}` : "/news");
    };

    return (
        <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-text-dark/60 whitespace-nowrap">Arsip:</span>
            <select
                className="rounded-lg border border-neutral-warm/30 bg-white px-3 py-2 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-earthy/30"
                value={currentYear ?? ""}
                aria-label="Pilih tahun arsip"
                onChange={handleChange}
            >
                <option value="">Semua Tahun</option>
                {options.map((y) => (
                    <option key={y} value={y}>
                        {y}
                    </option>
                ))}
            </select>
        </div>
    );
}
