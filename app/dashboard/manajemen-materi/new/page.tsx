import MaterialForm from "@/components/dashboard/materi/MaterialForm";
import { auth } from "@/auth";

export default async function NewMaterialPage() {
    const session = await auth();
    const userRole = session?.user?.role || "pembina";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Add New Material</h1>
                    <p className="text-text-dark/60 mt-1">Add a new resource to the archive.</p>
                </div>
            </div>
            <MaterialForm userRole={userRole} />
        </div>
    );
}
