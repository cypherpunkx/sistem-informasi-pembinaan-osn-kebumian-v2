"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string }[] = [
    { href: "/", label: "Beranda" },
    { href: "/persiapan", label: "Persiapan" },
    { href: "/silabus", label: "Silabus" },
    { href: "/arsip-soal", label: "Arsip Soal" },
    { href: "/statistik", label: "Statistik" },
    { href: "/news", label: "News" },
    { href: "/tentang", label: "Tentang" },
];

function isActive(pathname: string, href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
}

export default function PublicNavbar() {
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-20 w-full bg-white border-b border-neutral-warm/20 shadow-sm">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-accent-earthy hover:text-text-dark transition-colors">
                    OSN Kebumian
                </Link>
                <div className="flex items-center gap-5">
                    {NAV_ITEMS.map(({ href, label }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`text-sm font-medium transition-colors ${
                                    active
                                        ? "text-accent-earthy font-semibold border-b-2 border-accent-earthy -mb-0.5 pb-0.5"
                                        : "text-text-dark/80 hover:text-accent-earthy"
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                    <Link href="/login" className="text-sm font-medium text-accent-earthy hover:underline">
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
}
