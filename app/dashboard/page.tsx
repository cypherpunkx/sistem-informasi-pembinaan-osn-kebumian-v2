import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PembinaDashboard from "@/components/dashboard/PembinaDashboard";
import PesertaDashboard from "@/components/dashboard/PesertaDashboard";

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const role = session.user?.role as "admin" | "pembina" | "peserta" || "peserta";

    switch (role) {
        case "admin":
            return <AdminDashboard />;
        case "pembina":
            return <PembinaDashboard />;
        case "peserta":
        default:
            return <PesertaDashboard />;
    }
}
