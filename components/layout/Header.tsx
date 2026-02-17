"use client";

import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface HeaderProps {
    toggleSidebar: () => void;
    role?: "admin" | "pembina" | "peserta";
}

const roleTitles = {
    admin: "Dashboard Admin",
    pembina: "Dashboard Pembina",
    peserta: "Dashboard Saya",
};

export default function Header({ toggleSidebar, role = "peserta" }: HeaderProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const title = roleTitles[role] || "Dashboard";

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full bg-white border-b border-neutral-warm/20 px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-4 lg:hidden">
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-text-dark hover:bg-neutral-light rounded-md"
                    aria-label="Toggle sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="font-bold text-lg text-accent-earthy">{title}</span>
            </div>

            <div className="hidden lg:flex items-center">
                <h2 className="text-xl font-semibold text-text-dark">{title}</h2>
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 p-2 rounded-full hover:bg-neutral-light transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-neutral-warm/30 flex items-center justify-center text-accent-earthy">
                            <User className="w-5 h-5" />
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-warm/20 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-200">
                            <Link
                                href="/dashboard/profile"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-text-dark hover:bg-neutral-light"
                                onClick={() => setIsProfileOpen(false)}
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-light"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
