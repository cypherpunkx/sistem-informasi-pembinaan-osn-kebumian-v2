"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileText,
    Users,
    BarChart2,
    CheckCircle,
    TrendingUp,
    BarChart3,
    Award,
    Table2,
} from "lucide-react";
import type {
    ReportSummary,
    ReportTrendPoint,
    ReportDistributionBucket,
    ReportExamRow,
} from "@/app/actions/exams";

const DISTRIBUTION_COLORS = [
    "bg-red-400/90",      // 0–40
    "bg-amber-500/90",    // 41–60
    "bg-blue-500/80",     // 61–80
    "bg-emerald-500/90", // 81–100
] as const;

const PERIOD_OPTIONS = [
    { value: "7", label: "7 Hari" },
    { value: "30", label: "30 Hari" },
    { value: "90", label: "90 Hari" },
];

const TYPE_OPTIONS = [
    { value: "all", label: "Semua" },
    { value: "FIXED", label: "Standar" },
    { value: "DYNAMIC", label: "Adaptif" },
];

type SortKey = "title" | "participantCount" | "avgScore" | "maxScore" | "completionRate";
type SortDir = "asc" | "desc";

function exportTableToCSV(rows: ReportExamRow[]) {
    const headers = ["Nama Ujian", "Peserta", "Rata-rata", "Tertinggi", "Completion (%)"];
    const lines = [
        headers.join(","),
        ...rows.map((r) =>
            [
                `"${(r.title || "").replace(/"/g, '""')}"`,
                r.participantCount,
                r.avgScore ?? "",
                r.maxScore ?? "",
                `${r.completionRate}%`,
            ].join(",")
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-ujian-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function LaporanView({
    summary,
    trend,
    distribution,
    examRows,
    categories,
    periodDays,
    category,
    type,
}: {
    summary: ReportSummary;
    trend: ReportTrendPoint[];
    distribution: ReportDistributionBucket[];
    examRows: ReportExamRow[];
    categories: string[];
    periodDays: number;
    category: string;
    type: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("title");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [localPeriod, setLocalPeriod] = useState(String(periodDays));
    const [localCategory, setLocalCategory] = useState(category);
    const [localType, setLocalType] = useState(type);

    useEffect(() => {
        setLocalPeriod(String(periodDays));
        setLocalCategory(category);
        setLocalType(type);
    }, [periodDays, category, type]);

    const applyFilters = () => {
        const p = new URLSearchParams();
        p.set("period", localPeriod);
        if (localCategory !== "all") p.set("category", localCategory);
        if (localType !== "all") p.set("type", localType);
        router.push(`/dashboard/laporan?${p.toString()}`);
    };

    const resetFilters = () => {
        setLocalPeriod("30");
        setLocalCategory("all");
        setLocalType("all");
        router.push("/dashboard/laporan");
    };

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return examRows;
        return examRows.filter((r) => r.title.toLowerCase().includes(q));
    }, [examRows, search]);

    const sortedRows = useMemo(() => {
        const arr = [...filteredRows];
        arr.sort((a, b) => {
            let va: string | number | null = a[sortKey];
            let vb: string | number | null = b[sortKey];
            if (sortKey === "title") {
                va = (va as string) ?? "";
                vb = (vb as string) ?? "";
                return sortDir === "asc"
                    ? (va as string).localeCompare(vb as string)
                    : (vb as string).localeCompare(va as string);
            }
            va = va ?? -1;
            vb = vb ?? -1;
            const cmp = (va as number) - (vb as number);
            return sortDir === "asc" ? cmp : -cmp;
        });
        return arr;
    }, [filteredRows, sortKey, sortDir]);

    const maxTrend = Math.max(1, ...trend.map((t) => t.count));
    const maxDist = Math.max(1, ...distribution.map((d) => d.count));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Laporan & Analitik</h1>
                    <p className="text-text-dark/60 mt-1 text-sm">
                        Ringkasan dan analitik ujian dalam periode yang dipilih.
                    </p>
                </div>
            </div>

            <section
                className="bg-white p-4 rounded-xl shadow-sm border border-neutral-warm/20 flex flex-wrap items-center gap-3"
                aria-label="Filter"
            >
                <select
                    value={localPeriod}
                    onChange={(e) => setLocalPeriod(e.target.value)}
                    className="h-10 px-4 rounded-lg border border-neutral-warm/40 bg-white text-text-dark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-earthy/30"
                >
                    {PERIOD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            Periode: {o.label}
                        </option>
                    ))}
                </select>
                <select
                    value={localCategory}
                    onChange={(e) => setLocalCategory(e.target.value)}
                    className="h-10 px-4 rounded-lg border border-neutral-warm/40 bg-white text-text-dark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-earthy/30"
                >
                    <option value="all">Kategori: Semua</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            Kategori: {c}
                        </option>
                    ))}
                </select>
                <select
                    value={localType}
                    onChange={(e) => setLocalType(e.target.value)}
                    className="h-10 px-4 rounded-lg border border-neutral-warm/40 bg-white text-text-dark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-earthy/30"
                >
                    {TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            Tipe: {o.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={applyFilters}
                    className="h-10 px-5 rounded-lg bg-accent-earthy text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                    Terapkan Filter
                </button>
                <button
                    type="button"
                    onClick={resetFilters}
                    className="h-10 px-5 rounded-lg border border-neutral-warm/40 bg-white text-text-dark text-sm font-medium hover:bg-neutral-light transition-colors"
                >
                    Reset
                </button>
            </section>

            <hr className="border-neutral-warm/40" />

            <section
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
                aria-label="Ringkasan"
            >
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between animate-in fade-in duration-300">
                    <div>
                        <p className="text-sm text-text-dark/60 font-medium">Total Ujian</p>
                        <p className="text-3xl font-bold text-text-dark mt-2 tabular-nums">{summary.totalExams}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" aria-hidden />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between animate-in fade-in duration-300">
                    <div>
                        <p className="text-sm text-text-dark/60 font-medium">Total Peserta</p>
                        <p className="text-3xl font-bold text-text-dark mt-2 tabular-nums">
                            {summary.totalParticipants.toLocaleString("id-ID")}
                        </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg shrink-0">
                        <Users className="w-6 h-6 text-green-600" aria-hidden />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between animate-in fade-in duration-300">
                    <div>
                        <p className="text-sm text-text-dark/60 font-medium">Rata-rata</p>
                        <p className="text-3xl font-bold text-text-dark mt-2 tabular-nums">
                            {summary.avgScore != null ? summary.avgScore.toFixed(1) : "—"}
                        </p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-lg shrink-0">
                        <BarChart2 className="w-6 h-6 text-amber-600" aria-hidden />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between animate-in fade-in duration-300">
                    <div>
                        <p className="text-sm text-text-dark/60 font-medium">Completion</p>
                        <p className="text-3xl font-bold text-text-dark mt-2 tabular-nums">
                            {summary.completionRate != null ? `${summary.completionRate}%` : "—"}
                        </p>
                        <p className="text-xs text-text-dark/50 mt-2">peserta selesai mengerjakan</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-600" aria-hidden />
                    </div>
                </div>
            </section>

            <hr className="border-neutral-warm/40" />

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h2 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent-earthy" aria-hidden />
                        Peserta per Periode
                    </h2>
                    <div className="relative h-28 flex items-end gap-px">
                        {trend.length === 0 ? (
                            <p className="text-sm text-gray-500 self-center w-full text-center">Tidak ada data</p>
                        ) : (
                            <>
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pl-6" aria-hidden>
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div key={i} className="border-t border-gray-200" />
                                    ))}
                                </div>
                                <div className="absolute left-0 bottom-0 top-0 w-6 flex flex-col justify-between text-[10px] text-gray-500 tabular-nums">
                                    <span>{maxTrend}</span>
                                    <span>0</span>
                                </div>
                                <div className="flex-1 min-w-0 flex items-end gap-px pl-1">
                                    {trend.map((t) => (
                                        <div
                                            key={t.label}
                                            className="flex-1 min-w-0 flex flex-col items-center group"
                                            title={`${t.label}: ${t.count}`}
                                        >
                                            <div
                                                className="w-full rounded-t bg-accent-earthy min-h-[2px] transition-all duration-200 group-hover:brightness-110"
                                                style={{
                                                    height: `${Math.max(4, (t.count / maxTrend) * 96)}px`,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                        {trend.length > 0 && (
                            <>
                                <span>{trend[0]?.label}</span>
                                <span>{trend[trend.length - 1]?.label}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h2 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-earthy" aria-hidden />
                        Distribusi Nilai
                    </h2>
                    <div className="space-y-2.5">
                        {distribution.map((d, i) => (
                            <div key={d.bucket} className="flex items-center gap-3">
                                <span className="w-14 text-xs text-gray-600 shrink-0 font-medium">
                                    {d.bucket}
                                </span>
                                <div className="flex-1 h-6 rounded-md bg-gray-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-md transition-all ${DISTRIBUTION_COLORS[i] ?? "bg-accent-earthy/70"}`}
                                        style={{
                                            width: `${maxDist > 0 ? (d.count / maxDist) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-text-dark tabular-nums w-6 text-right">
                                    {d.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h2 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent-earthy" aria-hidden />
                    Rata-rata Nilai per Ujian
                </h2>
                <div className="space-y-2">
                    {examRows.length === 0 ? (
                        <p className="text-sm text-gray-500">Tidak ada data</p>
                    ) : (
                        examRows.slice(0, 10).map((r) => (
                            <div
                                key={r.examId}
                                className="flex items-center gap-3 gap-x-4"
                            >
                                <span className="w-40 sm:w-56 truncate text-sm text-text-dark shrink-0">
                                    {r.title}
                                </span>
                                <div className="flex-1 min-w-0 h-5 rounded-md bg-gray-100 overflow-hidden max-w-[200px]">
                                    <div
                                        className="h-full rounded-md bg-accent-earthy"
                                        style={{
                                            width: `${Math.min(100, (r.avgScore ?? 0))}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-text-dark tabular-nums shrink-0">
                                    {r.avgScore != null ? r.avgScore.toFixed(1) : "—"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <hr className="border-neutral-warm/40" />

            <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 className="text-lg font-bold text-text-dark flex items-center gap-2">
                        <Table2 className="w-5 h-5 text-accent-earthy" aria-hidden />
                        Detail Per Ujian
                    </h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="search"
                            placeholder="Cari ujian..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-neutral-warm/40 bg-white text-sm text-text-dark placeholder:text-text-dark/50 focus:outline-none focus:ring-2 focus:ring-accent-earthy/30 w-full sm:w-48"
                        />
                        <button
                            type="button"
                            onClick={() => exportTableToCSV(sortedRows)}
                            className="h-10 px-4 rounded-xl border border-neutral-warm/40 bg-white text-sm font-medium text-text-dark hover:bg-neutral-light transition-colors shrink-0"
                        >
                            Export CSV
                        </button>
                    </div>
                </div>
                <div className="rounded-xl border border-neutral-warm/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-warm/20 bg-gray-50">
                                    <th className="text-left font-semibold text-text-dark px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSortKey("title");
                                                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                            }}
                                            className="hover:text-accent-earthy"
                                        >
                                            Nama Ujian
                                        </button>
                                    </th>
                                    <th className="text-left font-semibold text-text-dark px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSortKey("participantCount");
                                                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                            }}
                                            className="hover:text-accent-earthy"
                                        >
                                            Peserta
                                        </button>
                                    </th>
                                    <th className="text-left font-semibold text-text-dark px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSortKey("avgScore");
                                                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                            }}
                                            className="hover:text-accent-earthy"
                                        >
                                            Avg
                                        </button>
                                    </th>
                                    <th className="text-left font-semibold text-text-dark px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSortKey("maxScore");
                                                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                            }}
                                            className="hover:text-accent-earthy"
                                        >
                                            Tertinggi
                                        </button>
                                    </th>
                                    <th className="text-left font-semibold text-text-dark px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSortKey("completionRate");
                                                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                                            }}
                                            className="hover:text-accent-earthy"
                                        >
                                            Completion
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-text-dark/50"
                                        >
                                            Tidak ada data ujian.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedRows.map((r) => (
                                        <tr
                                            key={r.examId}
                                            className="border-b border-neutral-warm/20 last:border-0"
                                        >
                                            <td className="px-4 py-3 text-text-dark">{r.title}</td>
                                            <td className="px-4 py-3 tabular-nums text-text-dark">
                                                {r.participantCount}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-text-dark">
                                                {r.avgScore != null ? r.avgScore.toFixed(1) : "—"}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-text-dark">
                                                {r.maxScore ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-text-dark">
                                                {r.completionRate}%
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
