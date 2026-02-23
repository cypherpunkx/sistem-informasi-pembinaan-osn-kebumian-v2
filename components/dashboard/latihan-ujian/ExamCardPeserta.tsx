"use client";

import Link from "next/link";
import { PlayCircle, Clock, BookOpen, Timer, CircleDot } from "lucide-react";

export type ExamStatus = "ongoing" | "upcoming" | "ended";

export type ExamWithStatus = {
    id: number;
    title: string;
    description: string | null;
    duration: number;
    type: string;
    category: string | null;
    availableStart?: Date | string | null;
    availableEnd?: Date | string | null;
    status: ExamStatus;
    /** Sisa menit sampai tutup (hanya jika ada availableEnd dan status ongoing) */
    minutesUntilEnd?: number | null;
    /** Teks "Ditutup pukul HH.mm" */
    ditutupPukul?: string | null;
    /** Untuk upcoming: "Mulai dalam X menit" atau "Mulai DD Feb HH.mm" */
    mulaiLabel?: string | null;
};

interface ExamCardPesertaProps {
    exam: ExamWithStatus;
}

export default function ExamCardPeserta({ exam }: ExamCardPesertaProps) {
    const isOngoing = exam.status === "ongoing";
    const isUpcoming = exam.status === "upcoming";
    const isEnded = exam.status === "ended";

    const statusConfig = {
        ongoing: {
            label: "Sedang Berlangsung",
            dotClass: "bg-emerald-500",
            badgeClass: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
        },
        upcoming: {
            label: exam.mulaiLabel ?? "Akan Dimulai",
            dotClass: "bg-amber-500",
            badgeClass: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
        },
        ended: {
            label: "Berakhir",
            dotClass: "bg-red-500",
            badgeClass: "bg-red-100 text-red-800 ring-1 ring-red-200",
        },
    };

    const config = statusConfig[exam.status];
    const isLatihan = (typeof exam.category === "string" && exam.category.trim() === "Latihan");
    const startButtonLabel = isLatihan ? "Mulai Latihan" : "Mulai Ujian";

    return (
        <div
            className={`flex flex-col h-full overflow-hidden rounded-xl border border-neutral-warm/20 bg-white shadow-sm transition-all hover:shadow-md ${isEnded ? "opacity-90" : ""}`}
        >
            <div className="p-5 flex-1 flex flex-col min-h-0">
                {/* Hanya status badge di atas — prioritas utama */}
                <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wide w-fit mb-3 ${config.badgeClass}`}
                >
                    <span className={`size-2 rounded-full shrink-0 ${config.dotClass}`} aria-hidden />
                    {config.label}
                </span>

                <h3 className="font-bold text-text-dark text-lg mb-0.5 leading-tight">{exam.title}</h3>
                {/* Kategori subtle di bawah judul */}
                {(exam.category || exam.type) && (
                    <p className="text-xs text-text-dark/50 mb-2">{exam.category || exam.type}</p>
                )}
                <p
                    className={`text-text-dark/70 text-sm mb-3 ${isOngoing ? "line-clamp-2" : "line-clamp-3"}`}
                    title={exam.description ?? undefined}
                >
                    {exam.description || "Tidak ada deskripsi."}
                </p>

                {/* Meta: durasi & mode */}
                <div className="flex items-center gap-4 text-sm text-text-dark/60 mb-3">
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 shrink-0" />
                        {exam.duration} menit
                    </span>
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 shrink-0" />
                        {exam.type === "FIXED" ? "Standar" : "Adaptif"}
                    </span>
                </div>

                {/* Waktu: sisa buka / ditutup / mulai - tanpa scroll */}
                <div className="mt-auto pt-3 border-t border-neutral-warm/20 space-y-1.5">
                    {isOngoing && exam.minutesUntilEnd != null && exam.minutesUntilEnd > 0 && (
                        <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <Timer className="w-4 h-4 shrink-0" />
                            Sisa waktu buka: {exam.minutesUntilEnd} menit
                        </p>
                    )}
                    {isOngoing && exam.ditutupPukul && (
                        <p className="flex items-center gap-2 text-xs text-text-dark/60">
                            <CircleDot className="w-3.5 h-3.5 shrink-0" />
                            Ditutup pukul {exam.ditutupPukul}
                        </p>
                    )}
                    {isUpcoming && exam.mulaiLabel && (
                        <p className="flex items-center gap-2 text-sm text-amber-700">
                            <Timer className="w-4 h-4 shrink-0" />
                            {exam.mulaiLabel}
                        </p>
                    )}
                    {isEnded && (
                        <p className="text-xs text-text-dark/50">Periode ujian telah berakhir.</p>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-neutral-warm/20 bg-neutral-light/20">
                {isOngoing ? (
                    <Link
                        href={`/dashboard/latihan-ujian/${exam.id}`}
                        className="flex items-center justify-center w-full px-4 py-3 font-bold rounded-lg gap-2 transition-colors bg-accent-earthy text-white hover:bg-text-dark"
                    >
                        <PlayCircle className="w-4 h-4 shrink-0" />
                        {startButtonLabel}
                    </Link>
                ) : (
                    <div
                        className="flex items-center justify-center w-full px-4 py-3 font-bold rounded-lg gap-2 bg-neutral-warm/30 text-text-dark/50 cursor-not-allowed"
                        aria-disabled="true"
                    >
                        <PlayCircle className="w-4 h-4 shrink-0" />
                        {isEnded ? "Berakhir" : "Belum dibuka"}
                    </div>
                )}
            </div>
        </div>
    );
}
