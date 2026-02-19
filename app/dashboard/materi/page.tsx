import MaterialCard from "@/components/dashboard/materi/MaterialCard";
import MaterialFilter from "@/components/dashboard/materi/MaterialFilter";
import MateriPagination from "@/components/dashboard/materi/MateriPagination";
import { getMaterialsForPeserta } from "@/app/actions/materials";
import { getCompletedMaterialIds } from "@/app/actions/progress";
import { auth } from "@/auth";

const DEFAULT_PAGE_SIZE = 12;

export default async function MaterialsPage({
    searchParams,
}: {
    searchParams?: Promise<{
        search?: string;
        topic?: string;
        type?: string;
        page?: string;
        limit?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;
    const pageNum = parseInt(resolvedSearchParams?.page || "1", 10);
    const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const limitNum = parseInt(resolvedSearchParams?.limit || String(DEFAULT_PAGE_SIZE), 10);
    const limit = Number.isNaN(limitNum) || limitNum < 1 ? DEFAULT_PAGE_SIZE : Math.max(DEFAULT_PAGE_SIZE, limitNum);

    const session = await auth();
    const [result, completedMaterialIds] = await Promise.all([
        getMaterialsForPeserta({
            search: resolvedSearchParams?.search,
            topic: resolvedSearchParams?.topic,
            type: resolvedSearchParams?.type,
            page,
            limit,
        }),
        session?.user?.id ? getCompletedMaterialIds(session.user.id) : Promise.resolve([]),
    ]);

    const completedSet = new Set(completedMaterialIds);
    const { data: materialsList, total, totalPages } = result;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Arsip Materi</h1>
                    <p className="text-text-dark/60 mt-1">Access all learning resources here.</p>
                </div>
            </div>

            <MaterialFilter hideStatus />

            {materialsList.length > 0 ? (
                <>
                    {total > 0 && (
                        <p className="text-sm text-text-dark/60">
                            Menampilkan {(page - 1) * result.limit + 1}–{Math.min(page * result.limit, total)} dari {total} materi
                        </p>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {materialsList.map((material) => (
                                    <MaterialCard
                                        key={material.id}
                                        material={material as Parameters<typeof MaterialCard>[0]["material"]}
                                        isCompleted={completedSet.has(material.id)}
                                    />
                                ))}
                            </div>
                        </div>
                        <MateriPagination total={total} page={page} totalPages={totalPages} limit={result.limit} />
                    </div>
                </>
            ) : (
                <div className="bg-white p-12 rounded-xl text-center border border-neutral-warm/20">
                    <p className="text-text-dark/50 italic">No materials found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
