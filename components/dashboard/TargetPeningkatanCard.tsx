import Link from "next/link";
import { Target } from "lucide-react";
import type { DominantWeakness } from "@/app/actions/analytics";

interface TargetPeningkatanCardProps {
    weakestTopic: DominantWeakness | null;
    targetPercent?: number;
}

export default function TargetPeningkatanCard({ weakestTopic, targetPercent = 70 }: TargetPeningkatanCardProps) {
    if (!weakestTopic) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 text-center">
                <p className="text-text-dark/60 text-sm">Selesaikan latihan soal untuk menetapkan target peningkatan.</p>
            </div>
        );
    }

    const current = Math.round(weakestTopic.accuracy);
    const target = Math.max(current + 10, targetPercent);

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20">
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-accent-earthy" />
                Target peningkatan
            </h3>
            <p className="text-text-dark/80 mb-2">
                <span className="font-medium">{weakestTopic.topic}</span> — saat ini <span className="font-bold">{current}%</span>, sasaran <span className="font-bold text-green-600">{target}%</span>.
            </p>
            <Link
                href={`/dashboard/latihan-ujian/topik/${encodeURIComponent(weakestTopic.topic)}`}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-accent-earthy text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
                Mulai latihan
            </Link>
        </div>
    );
}
