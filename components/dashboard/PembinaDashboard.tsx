import { Users, BookOpen, FileCheck, AlertTriangle, Target, TrendingUp, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getPembinaStats, getStudentProgress } from "@/app/actions/pembina";
import {
    getCohortRecommendationSummary,
    getSubtopicWeaknesses,
    getHighDifficultyFailures,
    getConsistencyLabels,
} from "@/app/actions/analytics";
import PembinaTopicTrendSection from "./pembina/PembinaTopicTrendSection";
import SubtopikWeaknessChart from "./pembina/SubtopikWeaknessChart";

const SCALE_MAX = 100;

/** Indikator interpretasi cepat: Low / Medium / Good berdasarkan skor 0–100. */
function scoreLabel(score: number): { text: string; className: string } {
    if (score >= 75) return { text: "Good", className: "bg-emerald-100 text-emerald-800" };
    if (score >= 60) return { text: "Medium", className: "bg-amber-100 text-amber-800" };
    return { text: "Low", className: "bg-red-100 text-red-800" };
}

/** Tampilkan skor dengan skala (X / 100) dan label opsional. */
function ScoreWithContext({ score, showLabel = true }: { score: number | string; showLabel?: boolean }) {
    const num = typeof score === "string" ? parseFloat(score) : score;
    const safe = Number.isNaN(num) ? 0 : num;
    const label = scoreLabel(safe);
    return (
        <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="font-bold text-text-dark">{safe.toFixed(1)}</span>
            <span className="text-text-dark/50 text-sm font-normal">/ {SCALE_MAX}</span>
            {showLabel && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${label.className}`}>
                    {label.text}
                </span>
            )}
        </span>
    );
}

/** Kartu yang bisa diklik (CTA). */
const cardClickable = "rounded-xl flex items-center gap-4 transition-shadow duration-200 hover:shadow-md cursor-pointer";
/** Kartu statistik hanya tampilan (tidak diklik). */
const cardStatic = "rounded-xl flex items-center gap-4 bg-white shadow-sm border border-neutral-warm/20 cursor-default select-none";

export default async function PembinaDashboard() {
    const [stats, studentsRaw, cohortRec, subtopicWeak, hardFailures, consistencyLabels] = await Promise.all([
        getPembinaStats(),
        getStudentProgress(),
        getCohortRecommendationSummary(),
        getSubtopicWeaknesses(),
        getHighDifficultyFailures(),
        getConsistencyLabels(),
    ]);

    const consistencyMap = new Map(consistencyLabels.map((c) => [c.userId, c.label]));
    const students = [...studentsRaw].sort((a, b) => Number(b.avgScore) - Number(a.avgScore)).map((s, i) => ({ ...s, rank: i + 1 }));

    // Fallback if data fetch fails
    if (!stats) {
        return (
            <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
            </div>
        );
    }

    const formatLastActive = (date: Date | null) => {
        if (!date) return "Never";
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return "Just now";
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-dark">Instructor Dashboard</h2>
                <p className="text-text-dark/60">Monitor student progress and manage materials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Satu CTA ke workspace review: ringkas, navigasi ke Nilai & Feedback (full KPI ada di sana) */}
                <Link
                    href="/dashboard/nilai"
                    className={`p-6 bg-amber-50/70 shadow-sm border border-amber-300/80 ${cardClickable} relative overflow-hidden`}
                    aria-label="Tinjau sesi yang menunggu feedback di Nilai & Feedback"
                >
                    <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded">
                            Perlu ditindak
                        </span>
                    </div>
                    <div className="p-3 bg-amber-400/90 text-white rounded-full shrink-0">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-amber-800">Pending Feedback</p>
                        <p className="text-2xl font-bold text-amber-900">{stats.pendingFeedback ?? 0}</p>
                        <p className="text-xs text-amber-700/80 mt-0.5">Tinjau di Nilai & Feedback →</p>
                    </div>
                </Link>
                <div className={`p-6 ${cardStatic}`} role="img" aria-label="Jumlah peserta bimbingan: statistik">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Mentored Students</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.totalStudents}</p>
                        <p className="text-xs text-text-dark/50 mt-0.5">Informasi</p>
                    </div>
                </div>
                <div className={`p-6 ${cardStatic}`} role="img" aria-label="Jumlah materi: statistik">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full shrink-0">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Uploaded Materials</p>
                        <p className="text-2xl font-bold text-text-dark">{stats.totalMaterials}</p>
                        <p className="text-xs text-text-dark/50 mt-0.5">Informasi</p>
                    </div>
                </div>
                <div className={`p-6 ${cardStatic}`} role="img" aria-label="Rata-rata nilai kelas: statistik">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                        <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-text-dark/60">Avg. Class Score</p>
                        <p className="text-xl font-bold text-text-dark flex flex-wrap items-center gap-1.5">
                            <ScoreWithContext score={stats.avgClassScore} />
                        </p>
                        {"avgClassScoreTrend" in stats && stats.avgClassScoreTrend != null && (
                            <p className="text-xs text-text-dark/50 mt-1">
                                {stats.avgClassScoreTrend >= 0 ? "↑" : "↓"} {Math.abs(stats.avgClassScoreTrend)}% dari minggu lalu
                            </p>
                        )}
                        <p className="text-xs text-text-dark/50 mt-0.5">Informasi</p>
                    </div>
                </div>
            </div>

            {/* Tren nilai per topik per peserta */}
            <PembinaTopicTrendSection students={students.map((s) => ({ id: s.id, name: s.name }))} />

            {/* Ranking & Perbandingan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Ranking & Perbandingan
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-warm/20">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Peringkat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Progress Materi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Rata-rata Nilai</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Konsistensi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Terakhir Aktif</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-warm/20">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text-dark">{student.rank}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-neutral-light rounded-full h-2.5 max-w-[100px]">
                                                    <div className="bg-accent-earthy h-2.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, student.progress))}%` }}></div>
                                                </div>
                                                <span className="text-xs text-text-dark/60">{student.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <ScoreWithContext score={student.avgScore} showLabel={true} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${consistencyMap.get(String(student.id)) === "Stagnan" ? "bg-amber-100 text-amber-800" : consistencyMap.get(String(student.id)) === "Naik" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-text-dark/70"}`}>
                                                {consistencyMap.get(String(student.id)) ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">{formatLastActive(student.lastActive)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-dark/50 italic">
                                        Belum ada data peserta.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center">
                    <Link href="/dashboard/nilai" className="text-sm text-accent-earthy hover:underline">Lihat Semua Nilai</Link>
                </div>
            </div>

            {/* Weakness index & Rekomendasi latihan tim */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h3 className="text-lg font-bold text-text-dark mb-4">Topik paling lemah di angkatan</h3>
                    {cohortRec.length > 0 ? (
                        <ul className="space-y-2">
                            {cohortRec.slice(0, 8).map((r) => (
                                <li key={r.topic} className="flex justify-between text-sm">
                                    <span className="text-text-dark">{r.topic}</span>
                                    <span className="font-medium text-text-dark/70">{r.participantCount} peserta</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-text-dark/60 text-sm">Belum ada data.</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent-earthy" />
                        Rekomendasi latihan tim
                    </h3>
                    {cohortRec.length > 0 ? (
                        <>
                            <p className="text-sm text-text-dark/70 mb-4">Topik yang perlu dilatih (jumlah peserta yang butuh latihan).</p>
                            <ul className="space-y-2 mb-4">
                                {cohortRec.slice(0, 5).map((r) => (
                                    <li key={r.topic} className="flex justify-between text-sm">
                                        <span>{r.topic}</span>
                                        <span className="font-medium">{r.participantCount} peserta</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/dashboard/nilai" className="text-sm text-accent-earthy hover:underline font-medium">
                                Lihat detail per peserta →
                            </Link>
                        </>
                    ) : (
                        <p className="text-text-dark/60 text-sm">Belum ada rekomendasi.</p>
                    )}
                </div>
            </div>

            {/* Subtopik paling bermasalah */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Subtopik paling bermasalah (angkatan)</h3>
                <SubtopikWeaknessChart data={subtopicWeak} />
            </div>

            {/* Alert high difficulty failure */}
            {hardFailures.length > 0 && (() => {
                const uniqueStudents = new Set(hardFailures.map((f) => f.userId)).size;
                const totalErrors = hardFailures.reduce((s, f) => s + f.failCount, 0);
                const summary =
                    uniqueStudents === 1
                        ? `1 siswa mengalami kesalahan pada soal HARD (total ${totalErrors} kesalahan).`
                        : `${uniqueStudents} siswa mengalami kesalahan pada soal HARD (total ${totalErrors} kesalahan).`;
                return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            Perhatian: soal HARD sering salah
                        </h3>
                        <p className="text-sm text-red-800/90 mb-3">{summary}</p>
                        <ul className="space-y-1 text-sm text-red-900">
                            {hardFailures.slice(0, 10).map((f, i) => (
                                <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                    <span className="font-medium">{f.userName}</span>
                                    <span className="text-red-700">·</span>
                                    <span>{f.topic}</span>
                                    <span className="font-semibold">{f.failCount}×</span>
                                </li>
                            ))}
                        </ul>
                        {hardFailures.length > 10 && (
                            <p className="text-xs text-red-700/80 mt-2">+ {hardFailures.length - 10} baris lainnya</p>
                        )}
                        <Link href="/dashboard/nilai" className="inline-block mt-3 text-sm font-medium text-red-700 hover:underline">
                            Tinjau nilai & feedback →
                        </Link>
                    </div>
                );
            })()}

            {/* Student Progress Overview (legacy table kept for compatibility) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Student Progress Overview</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-warm/20">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Material Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Avg. Exam Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-warm/20">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-neutral-light rounded-full h-2.5 max-w-[100px]">
                                                    <div className="bg-accent-earthy h-2.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, student.progress))}%` }}></div>
                                                </div>
                                                <span className="text-xs text-text-dark/60">{student.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <ScoreWithContext score={student.avgScore} showLabel={true} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark/60">{formatLastActive(student.lastActive)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-text-dark/50 italic">
                                        No student data available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center">
                    <Link href="/dashboard/nilai" className="text-sm text-accent-earthy hover:underline">View All Students</Link>
                </div>
            </div>
        </div>
    );
}
