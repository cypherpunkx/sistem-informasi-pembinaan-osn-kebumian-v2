import type { LucideIcon } from "lucide-react";
import {
    BookOpen,
    BookMarked,
    Archive,
    BarChart3,
    Trophy,
    Newspaper,
    Circle,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    BookOpen,
    BookMarked,
    Archive,
    BarChart3,
    Trophy,
    Newspaper,
    Circle,
};

export function getNavIcon(name: string): LucideIcon {
    return iconMap[name] ?? Circle;
}

export const DEFAULT_NAV_CARDS = [
    { title: "Persiapan", description: "Panduan dan materi persiapan OSN Kebumian.", href: "/persiapan", icon: "BookOpen" },
    { title: "Silabus", description: "Ruang lingkup materi dan topik yang diujikan.", href: "/silabus", icon: "BookMarked" },
    { title: "Arsip Soal", description: "Kumpulan soal OSN tahun sebelumnya.", href: "/arsip-soal", icon: "Archive" },
    { title: "Statistik", description: "Data peserta, provinsi, dan rekap tahunan.", href: "/statistik", icon: "BarChart3" },
    { title: "Tentang OSN", description: "Informasi umum tentang OSN Kebumian.", href: "/tentang", icon: "Trophy" },
    { title: "News & Pengumuman", description: "Update resmi dan pengumuman terbaru.", href: "/news", icon: "Newspaper" },
];

export const DEFAULT_PUBLIC_STATS = [
    { key: "provinsi", value: "38", label: "Provinsi" },
    { key: "peserta", value: "12.000+", label: "Peserta" },
    { key: "tahun", value: "20+", label: "Tahun Penyelenggaraan" },
    { key: "arsip", value: "500+", label: "Arsip Soal" },
];
