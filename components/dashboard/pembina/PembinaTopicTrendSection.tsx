"use client";

import { useState, useTransition, useEffect } from "react";
import { getTopicScoreTrend } from "@/app/actions/analytics";
import TopicTrendChart from "../progress/TopicTrendChart";

interface Student {
    id: number;
    name: string;
}

interface PembinaTopicTrendSectionProps {
    students: Student[];
}

export default function PembinaTopicTrendSection({ students }: PembinaTopicTrendSectionProps) {
    const [selectedId, setSelectedId] = useState<string>(students[0] ? String(students[0].id) : "");
    const [trend, setTrend] = useState<Awaited<ReturnType<typeof getTopicScoreTrend>>>([]);
    const [isPending, startTransition] = useTransition();

    const loadTrend = (userId: string) => {
        startTransition(async () => {
            const data = await getTopicScoreTrend(userId, { weeks: 8 });
            setTrend(data);
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedId(id);
        if (id) loadTrend(id);
    };

    useEffect(() => {
        if (selectedId) loadTrend(selectedId);
    }, []);

    if (students.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Tren nilai per topik per peserta</h3>
                <p className="text-text-dark/60 text-sm">Belum ada data peserta.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
            <h3 className="text-lg font-bold text-text-dark mb-4">Tren nilai per topik per peserta</h3>
            <div className="mb-4">
                <label className="block text-sm font-medium text-text-dark/70 mb-2">Pilih peserta</label>
                <select
                    value={selectedId}
                    onChange={handleChange}
                    className="w-full max-w-xs rounded-lg border border-neutral-warm/30 bg-white px-3 py-2 text-text-dark"
                >
                    {students.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                </select>
            </div>
            {isPending ? (
                <div className="h-64 flex items-center justify-center text-text-dark/50">Memuat...</div>
            ) : (
                <TopicTrendChart series={trend} />
            )}
        </div>
    );
}
