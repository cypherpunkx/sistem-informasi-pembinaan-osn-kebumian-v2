"use client";

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import type { TopicScoreTrendSeries } from "@/app/actions/analytics";

const COLORS = ["#0d9488", "#2563eb", "#16a34a", "#ea580c", "#9333ea"];
const MAX_PERIODS = 5;
const MAX_LINES = 5;

/** Format period YYYY-MM-DD jadi label singkat (e.g. "2 Feb") untuk sumbu X. */
function formatPeriodLabel(period: string): string {
    try {
        const d = new Date(period + "T12:00:00");
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch {
        return period;
    }
}

interface TopicTrendChartProps {
    series: TopicScoreTrendSeries[];
}

export default function TopicTrendChart({ series }: TopicTrendChartProps) {
    if (!series || series.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-text-dark/50 text-sm">
                Belum ada data tren. Kerjakan ujian untuk melihat perkembangan per topik.
            </div>
        );
    }

    const trimmedSeries = series.length > MAX_PERIODS ? series.slice(-MAX_PERIODS) : series;
    const topics = new Set<string>();
    trimmedSeries.forEach((s) => s.data.forEach((d) => topics.add(d.topic)));
    const topicList = Array.from(topics);

    const topicsWithData = topicList.filter((t) =>
        trimmedSeries.some((s) => s.data.some((d) => d.topic === t && d.accuracy > 0))
    );

    const dataStartIndex = series.findIndex((s) => s.data.some((d) => d.accuracy > 0));
    const hasOnlyRecentData = dataStartIndex >= 0 && dataStartIndex > series.length - 3;

    // Satu periode → bar chart per topik (hanya topik yang punya data)
    if (trimmedSeries.length === 1) {
        const single = trimmedSeries[0];
        const barData = single.data
            .map((d) => ({ topic: d.topic, nilai: Math.round(d.accuracy) }))
            .filter((d) => d.nilai > 0)
            .sort((a, b) => b.nilai - a.nilai);
        if (barData.length === 0) {
            return (
                <div className="h-64 flex items-center justify-center text-text-dark/50 text-sm">
                    Tidak ada data topik untuk periode ini.
                </div>
            );
        }
        return (
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="topic" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}%`, "Nilai"]} />
                        <Bar dataKey="nilai" fill={COLORS[0]} name="Nilai" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    const linesToShow = topicsWithData.length === 0 ? topicList : topicsWithData;
    const singleTopicMode = linesToShow.length === 1;

    const chartData = trimmedSeries.map((s) => {
        const row: Record<string, string | number> = { period: formatPeriodLabel(s.period) };
        s.data.forEach((d) => {
            row[d.topic] = Math.round(d.accuracy);
        });
        topicList.forEach((t) => {
            if (row[t] === undefined) row[t] = 0;
        });
        return row;
    });

    let trendInsight = "";
    if (trimmedSeries.length >= 2 && topicsWithData.length > 0) {
        const last = trimmedSeries[trimmedSeries.length - 1];
        const prev = trimmedSeries[trimmedSeries.length - 2];
        let bestTopic = "";
        let bestGain = -1;
        topicsWithData.forEach((topic) => {
            const currVal = last.data.find((d) => d.topic === topic)?.accuracy ?? 0;
            const prevVal = prev.data.find((d) => d.topic === topic)?.accuracy ?? 0;
            const gain = currVal - prevVal;
            if (gain > bestGain) {
                bestGain = gain;
                bestTopic = topic;
            }
        });
        if (bestTopic && bestGain > 0) {
            trendInsight = `Skor ${bestTopic} meningkat ${Math.round(bestGain)} poin minggu ini.`;
        }
    }
    if (hasOnlyRecentData && dataStartIndex >= 0 && !trendInsight) {
        trendInsight = "Data mulai tersedia di periode terakhir.";
    }

    return (
        <div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}%`, "Nilai"]} />
                        {!singleTopicMode && <Legend />}
                        {linesToShow.slice(0, MAX_LINES).map((topic, i) => (
                            <Line
                                key={topic}
                                type="monotone"
                                dataKey={topic}
                                stroke={COLORS[i % COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                name={topic}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {trendInsight && (
                <p className="text-sm text-text-dark/60 mt-2 italic">{trendInsight}</p>
            )}
        </div>
    );
}
