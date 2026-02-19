"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface DashboardShellProps {
    children: React.ReactNode;
    userRole?: "admin" | "pembina" | "peserta";
}

/** Path /dashboard/latihan-ujian/[numericId] = exam in progress (not result page). */
function isExamInProgress(pathname: string): boolean {
    return /^\/dashboard\/latihan-ujian\/\d+$/.test(pathname);
}

export default function DashboardShell({ children, userRole }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const examMode = isExamInProgress(pathname ?? "");

    if (examMode) {
        return (
            <div className="min-h-screen bg-neutral-light flex flex-col">
                <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-neutral-warm/20 flex items-center justify-center px-4 shadow-sm">
                    <span className="font-semibold text-accent-earthy">Ujian / Latihan — Jangan keluar halaman</span>
                </div>
                <main className="flex-1 pt-14 overflow-auto">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-light flex flex-col">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} role={userRole} />

            <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} role={userRole} />

                <main className="flex-1 p-4 lg:p-8">
                    {children}
                </main>

                <Footer />
            </div>
        </div>
    );
}
