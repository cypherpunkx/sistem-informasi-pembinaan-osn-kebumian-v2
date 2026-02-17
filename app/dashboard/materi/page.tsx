import MaterialCard from "@/components/dashboard/materi/MaterialCard";
import MaterialFilter from "@/components/dashboard/materi/MaterialFilter";
import { getMaterials } from "@/app/actions/materials";

export default async function MaterialsPage({
    searchParams,
}: {
    searchParams?: Promise<{
        search?: string;
        topic?: string;
        type?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;
    const materials = await getMaterials({
        search: resolvedSearchParams?.search,
        topic: resolvedSearchParams?.topic,
        type: resolvedSearchParams?.type,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Arsip Materi</h1>
                    <p className="text-text-dark/60 mt-1">Access all learning resources here.</p>
                </div>
            </div>

            <MaterialFilter />

            {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map((material) => (
                        <MaterialCard key={material.id} material={material as any} />
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl text-center border border-neutral-warm/20">
                    <p className="text-text-dark/50 italic">No materials found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
