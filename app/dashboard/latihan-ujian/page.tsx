import Link from "next/link";
import { PlayCircle, Clock, BookOpen, PenTool } from "lucide-react";
import { getExamsForPeserta } from "@/app/actions/exams";
import LatihanUjianFilters from "@/components/dashboard/latihan-ujian/LatihanUjianFilters";
import LatihanUjianPagination from "@/components/dashboard/latihan-ujian/LatihanUjianPagination";

const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 10;
const MAX_LIMIT = 100;

export default async function ExamListPage({
    searchParams,
}: {
    searchParams?: Promise<{ search?: string; type?: string; category?: string; page?: string; limit?: string }>;
}) {
    const params = await searchParams;
    const pageNum = parseInt(params?.page ?? "1", 10);
    const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const rawLimit = parseInt(params?.limit ?? String(DEFAULT_LIMIT), 10);
    const limit = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit));

    const { data: activeExams, total, totalPages, limit: resultLimit } = await getExamsForPeserta({
        search: params?.search,
        type: params?.type,
        category: params?.category,
        page,
        limit,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Latihan & Ujian</h1>
                    <p className="text-text-dark/60 mt-1">Pilih ujian atau sesi latihan untuk memulai.</p>
                </div>
                <button disabled className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-warm/20 text-text-dark/40 font-bold rounded-lg cursor-not-allowed">
                    <PenTool className="w-4 h-4" /> Custom Practice (Coming Soon)
                </button>
            </div>

            <LatihanUjianFilters />

            {activeExams.length > 0 ? (
                <>
                    {total > 0 && (
                        <p className="text-sm text-text-dark/60">
                            Menampilkan {(page - 1) * resultLimit + 1}–{Math.min(page * resultLimit, total)} dari {total} ujian
                        </p>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeExams.map((exam) => (
                                    <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                                        <div className="p-5 flex-1">
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-3 inline-block
                                                ${exam.type === "FIXED" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                                {exam.category || exam.type}
                                            </span>
                                            <h3 className="font-bold text-text-dark text-lg mb-2">{exam.title}</h3>
                                            <p className="text-text-dark/70 text-sm line-clamp-3 mb-4">
                                                {exam.description || "Tidak ada deskripsi."}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-text-dark/60 mt-auto">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{exam.duration} menit</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span>{exam.type === "FIXED" ? "Standar" : "Adaptif"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 border-t border-neutral-warm/20 bg-neutral-light/20">
                                            <Link
                                                href={`/dashboard/latihan-ujian/${exam.id}`}
                                                className="flex items-center justify-center w-full px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors gap-2"
                                            >
                                                <PlayCircle className="w-4 h-4" /> Mulai Ujian
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <LatihanUjianPagination total={total} page={page} limit={resultLimit} totalPages={totalPages} />
                    </div>
                </>
            ) : (
                <div className="bg-white p-12 rounded-xl text-center border border-neutral-warm/20">
                    <p className="text-text-dark/50 italic">
                        {params?.search || params?.type || params?.category
                            ? "Tidak ada ujian yang sesuai filter. Coba ubah filter atau reset."
                            : "Belum ada ujian aktif saat ini."}
                    </p>
                </div>
            )}
        </div>
    );
}
