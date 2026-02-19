"use client";

import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

export interface TopicAccuracyPoint {
    topic: string;
    accuracy: number;
}

interface TopicRadarChartProps {
    data: TopicAccuracyPoint[];
}


const TOPIC_DISPLAY_MAP: Record<string, string> = {
    Geology: "Geologi",
    Meteorology: "Meteorologi",
    Oceanography: "Oseanografi",
};

/** Label singkat & konsisten: buang "Kebumian: ", normalisasi EN→ID, max 12 karakter. */
function normalizeLabel(topic: string): string {
    let trimmed = topic.replace(/^Kebumian:\s*/i, "").trim();
    trimmed = TOPIC_DISPLAY_MAP[trimmed] ?? trimmed;
    if (trimmed.length <= 12) return trimmed;
    return trimmed.slice(0, 11) + "…";
}

/** Kunci untuk merge duplikat (e.g. Geology vs Kebumian: Geologi). */
function normalizeKey(topic: string): string {
    const label = normalizeLabel(topic);
    const lower = label.toLowerCase();
    if (lower.includes("geolog")) return "Geologi";
    if (lower.includes("meteorolog")) return "Meteorologi";
    if (lower.includes("oseanograf") || lower.includes("ocean")) return "Oseanografi";
    return label;
}

export default function TopicRadarChart({ data }: TopicRadarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-text-dark/50 text-sm">
                Belum ada data topik. Kerjakan ujian untuk melihat radar.
            </div>
        );
    }

    const byKey = new Map<string, { label: string; value: number }>();
    data.forEach((d) => {
        const key = normalizeKey(d.topic);
        const label = normalizeLabel(d.topic);
        const value = Math.round(d.accuracy);
        const existing = byKey.get(key);
        if (!existing || value > existing.value) {
            byKey.set(key, { label, value });
        }
    });
    const chartData = Array.from(byKey.values()).map((v) => ({
        subject: v.label,
        shortSubject: v.label,
        value: v.value,
        fullMark: 100,
    }));

    const sorted = [...chartData].sort((a, b) => a.value - b.value);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];

    return (
        <div>
            <div className="h-96 min-h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                        <PolarAngleAxis
                            dataKey="shortSubject"
                            tick={{ fontSize: 12, fill: "#374151" }}
                            tickLine={false}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickFormatter={(v: number) => String(v)}
                        />
                        <Radar
                            name="Akurasi"
                            dataKey="value"
                            stroke="#0d9488"
                            strokeWidth={3}
                            fill="#0d9488"
                            fillOpacity={0.22}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0].payload as { subject: string; value: number };
                                return (
                                    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-md text-sm">
                                        <div className="font-semibold text-text-dark">{p.subject}</div>
                                        <div className="text-text-dark/70">Akurasi: {p.value}%</div>
                                    </div>
                                );
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            {chartData.length > 0 && weakest && strongest && (
                <div className="text-sm text-text-dark/70 mt-2 space-y-1">
                    <p><span className="font-medium text-text-dark">Terkuat:</span> {strongest.shortSubject} ({strongest.value}%)</p>
                    <p><span className="font-medium text-text-dark">Terlemah:</span> {weakest.shortSubject} ({weakest.value}%)</p>
                </div>
            )}
        </div>
    );
}
