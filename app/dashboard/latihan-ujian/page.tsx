import { getExamsForPeserta } from "@/app/actions/exams";
import LatihanUjianFilters from "@/components/dashboard/latihan-ujian/LatihanUjianFilters";
import LatihanUjianPagination from "@/components/dashboard/latihan-ujian/LatihanUjianPagination";
import ExamCardPeserta, { type ExamWithStatus } from "@/components/dashboard/latihan-ujian/ExamCardPeserta";

const DEFAULT_LIMIT = 12;
const MIN_LIMIT = 10;
const MAX_LIMIT = 100;

type ExamRow = Awaited<ReturnType<typeof getExamsForPeserta>>["data"][number];

function computeStatusAndMeta(exam: ExamRow, now: Date): ExamWithStatus {
    const start = exam.availableStart != null ? new Date(exam.availableStart) : null;
    const end = exam.availableEnd != null ? new Date(exam.availableEnd) : null;

    let status: ExamWithStatus["status"] = "ongoing";
    let minutesUntilEnd: number | null = null;
    let ditutupPukul: string | null = null;
    let mulaiLabel: string | null = null;

    if (end && now > end) {
        status = "ended";
    } else if (start && now < start) {
        status = "upcoming";
        const mins = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 60000));
        if (mins <= 60) {
            mulaiLabel = `Mulai dalam ${mins} menit`;
        } else {
            mulaiLabel = `Mulai ${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} pukul ${start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
        }
    } else {
        status = "ongoing";
        if (end) {
            minutesUntilEnd = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 60000));
            ditutupPukul = end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
        }
    }

    return {
        ...exam,
        status,
        minutesUntilEnd: minutesUntilEnd ?? undefined,
        ditutupPukul: ditutupPukul ?? undefined,
        mulaiLabel: mulaiLabel ?? undefined,
    };
}

function sortByPriority(a: ExamWithStatus, b: ExamWithStatus): number {
    const order = { ongoing: 0, upcoming: 1, ended: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    if (a.status === "ongoing" && b.status === "ongoing") {
        const ma = a.minutesUntilEnd ?? Infinity;
        const mb = b.minutesUntilEnd ?? Infinity;
        return ma - mb;
    }
    if (a.status === "upcoming" && b.status === "upcoming") {
        const ta = a.availableStart ? new Date(a.availableStart).getTime() : 0;
        const tb = b.availableStart ? new Date(b.availableStart).getTime() : 0;
        return ta - tb;
    }
    if (a.status === "ended" && b.status === "ended") {
        const ta = a.availableEnd ? new Date(a.availableEnd).getTime() : 0;
        const tb = b.availableEnd ? new Date(b.availableEnd).getTime() : 0;
        return tb - ta;
    }
    return 0;
}

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

    const { data: rawExams, total, totalPages, limit: resultLimit } = await getExamsForPeserta({
        search: params?.search,
        type: params?.type,
        category: params?.category,
        page,
        limit,
    });

    const now = new Date();
    const examsWithStatus: ExamWithStatus[] = rawExams
        .map((exam) => computeStatusAndMeta(exam, now))
        .sort(sortByPriority);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-dark">Latihan & Ujian</h1>
                <p className="text-text-dark/60 mt-1">Pilih ujian atau sesi latihan untuk memulai.</p>
            </div>

            <LatihanUjianFilters />

            {examsWithStatus.length > 0 ? (
                <>
                    {total > 0 && (
                        <p className="text-sm text-text-dark/60">
                            Menampilkan {(page - 1) * resultLimit + 1}–{Math.min(page * resultLimit, total)} dari {total} ujian
                        </p>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {examsWithStatus.map((exam) => (
                                    <ExamCardPeserta key={exam.id} exam={exam} />
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
