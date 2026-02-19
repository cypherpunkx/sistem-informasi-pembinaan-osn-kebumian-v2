"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface ProgressChartsProps {
    categoryData: { category: string | null; avgScore: number }[];
    weeklyData: { date: string; count: number }[];
}

/** Warna berdasarkan performa: &lt;30 merah, 30–60 oranye, ≥60 hijau. Konsisten & bermakna untuk siswa. */
function getPerformanceColor(score: number): string {
    if (score < 30) return "#dc2626"; // red-600
    if (score < 60) return "#ea580c"; // orange-600
    return "#16a34a"; // green-600
}

/** Label interpretatif agar siswa paham arti angka. */
function getPerformanceLabel(score: number): string {
    if (score < 30) return "Perlu latihan";
    if (score < 60) return "Cukup";
    return "Baik";
}

const WEEKLY_BAR_ACTIVE = "#0d9488";
const WEEKLY_BAR_EMPTY = "#e2e8f0";

export default function ProgressCharts({ categoryData, weeklyData }: ProgressChartsProps) {
    const formattedWeeklyData = weeklyData.map(d => ({
        ...d,
        label: new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }),
    }));

    const totalExams = formattedWeeklyData.reduce((s, d) => s + d.count, 0);
    const bestDay = totalExams > 0
        ? formattedWeeklyData.reduce((best, d) => (d.count > best.count ? d : best), formattedWeeklyData[0])
        : null;
    const weeklyInsight = totalExams === 0
        ? "Belum ada aktivitas di 7 hari terakhir."
        : bestDay
            ? `Kamu lebih aktif di hari ${bestDay.label}.`
            : "";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Average Score by Category</h3>
                <p className="text-sm text-text-dark/60 mb-3">Warna: merah = perlu latihan (&lt;30), oranye = cukup (30–60), hijau = baik (≥60).</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} margin={{ top: 28 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(value: number | undefined) => {
                                    const v = Math.round(Number(value ?? 0));
                                    return [`${v} · ${getPerformanceLabel(v)}`, "Rata-rata"];
                                }}
                                contentStyle={{ fontSize: 12 }}
                            />
                            <Bar
                                dataKey="avgScore"
                                radius={[4, 4, 0, 0]}
                                label={(props: { x?: string | number; y?: string | number; width?: string | number; value?: string | number | boolean | null }) => {
                                    const v = Math.round(Number(props.value ?? 0));
                                    const label = getPerformanceLabel(v);
                                    const x = Number(props.x ?? 0) + Number(props.width ?? 0) / 2;
                                    const y = Number(props.y ?? 0) - 4;
                                    return (
                                        <g>
                                            <text x={x} y={y} textAnchor="middle" fill="#374151" fontSize={12} fontWeight={600}>
                                                {v}
                                            </text>
                                            <text x={x} y={y + 14} textAnchor="middle" fill="#6b7280" fontSize={10}>
                                                {label}
                                            </text>
                                        </g>
                                    );
                                }}
                            >
                                {categoryData.map((row, i) => (
                                    <Cell key={i} fill={getPerformanceColor(row.avgScore)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Weekly Activity: 7 hari terakhir; hari kosong = abu soft, ada insight di bawah */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Weekly Activity (Exams)</h3>
                <p className="text-sm text-text-dark/60 mb-3">7 hari terakhir, jumlah ujian selesai per hari.</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedWeeklyData} margin={{ top: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value: number | undefined) => [value ?? 0, "Ujian selesai"]} labelFormatter={(label) => label} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: "top", formatter: (v: string | number | boolean | null | undefined) => (Number(v ?? 0) > 0 ? String(Number(v ?? 0)) : ""), fontSize: 11, fill: "#374151" }}>
                                {formattedWeeklyData.map((row, i) => (
                                    <Cell key={i} fill={row.count > 0 ? WEEKLY_BAR_ACTIVE : WEEKLY_BAR_EMPTY} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-sm text-text-dark/60 mt-3 italic">{weeklyInsight}</p>
            </div>
        </div>
    );
}
