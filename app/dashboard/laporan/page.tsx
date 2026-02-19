import { Suspense } from "react";
import { getReportData, getDistinctExamCategories } from "@/app/actions/exams";
import LaporanView from "@/components/dashboard/laporan/LaporanView";

export default async function LaporanPage({
    searchParams,
}: {
    searchParams?: Promise<{
        period?: string;
        category?: string;
        type?: string;
    }>;
}) {
    const params = await searchParams;
    const periodDays = Math.min(
        90,
        Math.max(7, parseInt(params?.period ?? "30", 10) || 30)
    );
    const category = params?.category ?? "all";
    const type = (params?.type as "FIXED" | "DYNAMIC" | "all") ?? "all";

    const [report, categories] = await Promise.all([
        getReportData({ periodDays, category: category === "all" ? undefined : category, type }),
        getDistinctExamCategories(),
    ]);

    return (
        <Suspense fallback={<LaporanPageSkeleton />}>
            <LaporanView
                summary={report.summary}
                trend={report.trend}
                distribution={report.distribution}
                examRows={report.examRows}
                categories={categories}
                periodDays={periodDays}
                category={category}
                type={type}
            />
        </Suspense>
    );
}

function LaporanPageSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <div className="h-8 w-64 bg-neutral-warm/30 rounded" />
                <div className="h-4 w-96 mt-2 bg-neutral-warm/20 rounded" />
            </div>
            <div className="flex gap-3">
                <div className="h-10 w-32 bg-neutral-warm/20 rounded-xl" />
                <div className="h-10 w-36 bg-neutral-warm/20 rounded-xl" />
            </div>
            <hr className="border-neutral-warm/30" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-neutral-warm/20" />
                ))}
            </div>
            <hr className="border-neutral-warm/30" />
            <div className="h-64 rounded-xl bg-neutral-warm/20" />
        </div>
    );
}
