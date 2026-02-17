import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Cast role to specific union type if needed, or rely on string compatibility
    const role = (session.user?.role as "admin" | "pembina" | "peserta") || "peserta";

    return (
        <DashboardShell userRole={role}>
            {children}
        </DashboardShell>
    );
}
