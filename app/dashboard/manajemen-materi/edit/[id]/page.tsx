import MaterialForm from "@/components/dashboard/materi/MaterialForm";
import { getMaterialById } from "@/app/actions/materials";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) notFound();

    const material = await getMaterialById(id);
    const session = await auth();
    const userRole = session?.user?.role || "pembina";

    if (!material) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Edit Material</h1>
                    <p className="text-text-dark/60 mt-1">Update material details.</p>
                </div>
            </div>
            <MaterialForm initialData={material} userRole={userRole} />
        </div>
    );
}
