"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface DashboardShellProps {
    children: React.ReactNode;
    userRole?: "admin" | "pembina" | "peserta";
}

export default function DashboardShell({ children, userRole }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
