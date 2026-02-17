"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    Database,
    FileText,
    TrendingUp,
    HelpCircle,
    User,
    LogOut
} from "lucide-react";
import { logout } from "@/app/actions/auth";

const roleNavItems = {
    admin: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Manajemen Materi", href: "/dashboard/manajemen-materi", icon: BookOpen },
        { name: "Bank Soal", href: "/dashboard/bank-soal", icon: Database },
        { name: "Manajemen Ujian", href: "/dashboard/manajemen-ujian", icon: FileText },
        { name: "Manajemen Pengguna", href: "/dashboard/manajemen-pengguna", icon: User },
        { name: "Laporan & Analitik", href: "/dashboard/laporan", icon: TrendingUp },
        { name: "Pengaturan", href: "/dashboard/pengaturan", icon: HelpCircle }, // Using HelpCircle as placeholder for Settings if needed, or import Settings icon
    ],
    pembina: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Arsip Materi", href: "/dashboard/manajemen-materi", icon: BookOpen },
        { name: "Bank Soal", href: "/dashboard/bank-soal", icon: Database },
        { name: "Manajemen Ujian", href: "/dashboard/manajemen-ujian", icon: FileText },
        { name: "Nilai & Feedback", href: "/dashboard/nilai", icon: TrendingUp },
    ],
    peserta: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Arsip Materi", href: "/dashboard/materi", icon: BookOpen },
        { name: "Latihan / Ujian", href: "/dashboard/latihan-ujian", icon: FileText },
        { name: "Progres Saya", href: "/dashboard/progres", icon: TrendingUp },
        { name: "Bantuan / FAQ", href: "/dashboard/faq", icon: HelpCircle },
    ],
};

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    role?: "admin" | "pembina" | "peserta";
}

export default function Sidebar({ isOpen, setIsOpen, role = "peserta" }: SidebarProps) {
    const pathname = usePathname();
    const navItems = roleNavItems[role] || roleNavItems.peserta;

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-neutral-warm/20 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-16 items-center justify-center border-b border-neutral-warm/20">
                    <h1 className="text-2xl font-bold text-accent-earthy">OSN Platform</h1>
                </div>
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8.5rem)] pb-20">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-accent-earthy/10 text-accent-earthy"
                                    : "text-text-dark/70 hover:bg-neutral-light hover:text-text-dark"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-neutral-warm/20 bg-white">
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-neutral-light transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
