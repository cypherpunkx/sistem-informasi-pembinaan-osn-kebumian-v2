import Link from "next/link";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import MaterialFilter from "@/components/dashboard/materi/MaterialFilter";
import StatusBadge from "@/components/dashboard/materi/StatusBadge";
import { getMaterials, deleteMaterial, updateMaterialStatus } from "@/app/actions/materials";

export default async function MaterialManagementPage({
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
                    <h1 className="text-2xl font-bold text-text-dark">Manajemen Materi</h1>
                    <p className="text-text-dark/60 mt-1">Upload and manage learning resources.</p>
                </div>
                <Link
                    href="/dashboard/manajemen-materi/new"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Material
                </Link>
            </div>


            <MaterialFilter />

            <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-warm/20">
                        <thead className="bg-neutral-light">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Title</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Topic</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Tags</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-warm/20">
                            {materials.length > 0 ? (
                                materials.map((material) => (
                                    <tr key={material.id} className="hover:bg-neutral-warm/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-text-dark max-w-xs truncate" title={material.title}>
                                                {material.title}
                                            </div>
                                            <div className="text-xs text-text-dark/50 max-w-xs truncate">{material.url}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={material.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            {material.topic}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                ${material.type === 'PDF' ? 'bg-red-100 text-red-700' :
                                                    material.type === 'VIDEO' ? 'bg-blue-100 text-blue-700' :
                                                        material.type === 'SLIDE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {material.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {Array.isArray(material.tags) && (material.tags as string[]).slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-0.5 bg-neutral-warm/10 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {Array.isArray(material.tags) && (material.tags as string[]).length > 2 && (
                                                    <span className="text-xs px-2 py-0.5 bg-neutral-warm/10 rounded-full">...</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            <div className="flex items-center gap-2">
                                                {/* Quick Status Actions */}
                                                {(material.status === 'DRAFT' || material.status === 'PENDING') && (
                                                    <form action={async () => {
                                                        "use server";
                                                        await updateMaterialStatus(material.id, "PUBLISHED");
                                                    }}>
                                                        <button type="submit" className="text-green-600 hover:text-green-800 text-xs font-bold border border-green-200 px-2 py-1 rounded" title="Publish">
                                                            Publish
                                                        </button>
                                                    </form>
                                                )}

                                                <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-text-dark/60 hover:text-accent-earthy" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <Link href={`/dashboard/manajemen-materi/edit/${material.id}`} className="text-text-dark/60 hover:text-blue-600" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteMaterial(material.id);
                                                }}>
                                                    <button type="submit" className="text-text-dark/60 hover:text-red-600" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-text-dark/50 italic">
                                        No materials found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
