import Link from "next/link";
import { BookOpen, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Recommendation } from "@/app/actions/recommendations";

interface RecommendationDashboardProps {
    recommendations: Recommendation[];
}

export default function RecommendationDashboard({ recommendations }: RecommendationDashboardProps) {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 text-center">
                <p className="text-text-dark/60">Belum ada data rekomendasi. Silakan kerjakan latihan soal terlebih dahulu.</p>
            </div>
        );
    }

    // Filter relevant recommendations (High & Medium priority)
    const priorityItems = recommendations.filter(r => r.priority === "HIGH" || r.priority === "MEDIUM");
    const lowPriorityItems = recommendations.filter(r => r.priority === "LOW");

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-earthy" />
                Rekomendasi Latihan Kamu
            </h2>

            {priorityItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {priorityItems.map((item, idx) => (
                        <RecommendationCard key={idx} item={item} />
                    ))}
                </div>
            ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <p>Hebat! Kamu memiliki pemahaman yang baik di semua topik yang telah dikerjakan.</p>
                </div>
            )}

            {lowPriorityItems.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-text-dark/80 mb-4">Topik Dikuasai</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {lowPriorityItems.map((item, idx) => (
                            <div key={idx} className="p-4 bg-white rounded-lg border border-neutral-warm/20 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                                <div>
                                    <h4 className="font-bold text-text-dark">{item.topic}</h4>
                                    <p className="text-xs text-text-dark/60">Akurasi: {Math.round(item.accuracy)}%</p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function RecommendationCard({ item }: { item: Recommendation }) {
    const isHigh = item.priority === "HIGH";

    return (
        <div className={`p-5 rounded-xl border ${isHigh ? "bg-red-50/50 border-red-200" : "bg-yellow-50/50 border-yellow-200"} flex flex-col h-full`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-text-dark">{item.topic}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isHigh ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {item.accuracy.toFixed(0)}% Akurasi
                </span>
            </div>

            <p className="text-sm text-text-dark/70 mb-4 flex-1">
                {isHigh ? "Perlu latihan intensif untuk meningkatkan pemahaman." : "Sedikit lagi! Latihan tambahan akan membantu."}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-white h-2 rounded-full mb-4 overflow-hidden border border-neutral-warm/10">
                <div
                    className={`h-full ${isHigh ? "bg-red-500" : "bg-yellow-500"}`}
                    style={{ width: `${item.accuracy}%` }}
                />
            </div>

            <div className="space-y-3 mt-auto">
                <Link
                    href={`/dashboard/latihan/prioritas/${encodeURIComponent(item.topic)}`}
                    className={`block w-full text-center py-2 rounded-lg font-bold text-white transition-colors ${isHigh ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"}`}
                >
                    Mulai Latihan {item.topic}
                </Link>

                {item.materials && item.materials.length > 0 && (
                    <div className="pt-3 border-t border-neutral-warm/10">
                        <p className="text-xs font-bold text-text-dark/60 mb-2 uppercase tracking-wide">Materi Pendukung:</p>
                        <div className="space-y-2">
                            {item.materials.map((mat: any, i: number) => (
                                <Link key={i} href={mat.url} target="_blank" className="flex items-center gap-2 text-sm text-accent-earthy hover:underline">
                                    <BookOpen className="w-3 h-3" />
                                    <span className="truncate">{mat.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
