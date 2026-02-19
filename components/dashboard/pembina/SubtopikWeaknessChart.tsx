"use client";

import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SubtopicWeakness } from "@/app/actions/analytics";

interface SubtopikWeaknessChartProps {
    data: SubtopicWeakness[];
}

/** Persentase jawaban salah (error rate) untuk interpretasi "bermasalah". */
function errorRate(accuracy: number): number {
    return Math.round(100 - accuracy);
}

/** Warna risiko: ≥70% salah merah, 50–70% oranye, <50% hijau. */
function barColor(errorPct: number): string {
    if (errorPct >= 70) return "#dc2626"; // red-600
    if (errorPct >= 50) return "#ea580c"; // orange-600
    return "#16a34a"; // green-600
}

export default function SubtopikWeaknessChart({ data }: SubtopikWeaknessChartProps) {
    if (!data || data.length === 0) {
        return (
            <p className="text-text-dark/60 text-sm">
                Tidak ada subtopik bermasalah (akurasi ≥ 80%). Belum ada data ujian, atau performa angkatan sudah baik.
            </p>
        );
    }

    const chartData = data.slice(0, 8).map((s) => ({
        name: s.subtopic,
        errorPct: errorRate(s.accuracy),
    }));

    return (
        <div>
            <p className="text-sm text-text-dark/60 mb-3">
                Berdasarkan persentase jawaban salah (semakin panjang bar = semakin perlu perhatian).
            </p>
            <div className="h-72 min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 48 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip
                            formatter={(value: number | undefined) => [`${value ?? 0}% jawaban salah`, "Error rate"]}
                            labelFormatter={(label) => label}
                            contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="errorPct" name="% salah" radius={[0, 4, 4, 0]} label={{ position: "right", formatter: (v: string | number | boolean | null | undefined) => `${Number(v ?? 0)}%`, fontSize: 11, fill: "#374151" }}>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={barColor(chartData[i].errorPct)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4">
                <Link
                    href="/dashboard/manajemen-materi/new"
                    className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline"
                >
                    Buat latihan tambahan untuk subtopik bermasalah →
                </Link>
            </div>
        </div>
    );
}
