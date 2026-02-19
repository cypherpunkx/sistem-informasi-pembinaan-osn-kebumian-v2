import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { DominantWeakness } from "@/app/actions/analytics";

interface DominantWeaknessSectionProps {
    weaknesses: DominantWeakness[];
}

export default function DominantWeaknessSection({ weaknesses }: DominantWeaknessSectionProps) {
    if (!weaknesses || weaknesses.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 text-center">
                <p className="text-text-dark/60">Tidak ada kelemahan dominan (akurasi topik ≥ 80%). Kerjakan latihan soal untuk melihat analisis, atau pertahankan performa.</p>
            </div>
        );
    }

    const summary = weaknesses.map((w) => `${w.topic} (${Math.round(w.accuracy)}%)`).join(", ");

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Kelemahan dominan
            </h3>
            <p className="text-text-dark/80 mb-4">
                {summary}
            </p>
            <p className="text-sm text-text-dark/70 mb-4">
                Disarankan: fokus latihan topik di atas dan review materi terkait.
            </p>
            <div className="flex flex-wrap gap-2">
                {weaknesses.slice(0, 5).map((w) => (
                    <Link
                        key={w.topic}
                        href={`/dashboard/latihan-ujian/topik/${encodeURIComponent(w.topic)}`}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                    >
                        Latihan {w.topic}
                    </Link>
                ))}
            </div>
        </div>
    );
}
