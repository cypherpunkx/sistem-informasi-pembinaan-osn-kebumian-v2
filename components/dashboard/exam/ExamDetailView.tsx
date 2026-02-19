"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Pencil,
    Copy,
    MoreVertical,
    Archive,
    ArchiveRestore,
    Trash2,
    Plus,
    CheckCircle,
    Circle,
    Clock,
    FileQuestion,
    Users,
    BarChart2,
    ListOrdered,
    Calendar,
    Tag,
    RefreshCw,
} from "lucide-react";
import {
    deleteExam,
    toggleExamArchive,
    duplicateExam,
} from "@/app/actions/exams";
import type { ExamDetailParticipant, ExamDetailStats } from "@/app/actions/exams";
import DeleteExamModal from "./DeleteExamModal";

type Exam = {
    id: number;
    title: string;
    description: string | null;
    duration: number;
    type: string;
    category: string | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};

type QuestionRow = { id: number; content: string | null };

const TABS = [
    { id: "ringkasan", label: "Ringkasan" },
    { id: "soal", label: "Soal" },
    { id: "peserta", label: "Peserta" },
    { id: "statistik", label: "Statistik" },
    { id: "pengaturan", label: "Pengaturan" },
] as const;

function formatDate(d: Date | null): string {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").slice(0, 80);
}

export default function ExamDetailView({
    exam,
    questionCount,
    participantCount,
    stats,
    participants,
    questionsList,
}: {
    exam: Exam;
    questionCount: number;
    participantCount: number;
    stats: ExamDetailStats;
    participants: ExamDetailParticipant[];
    questionsList: QuestionRow[];
}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("ringkasan");
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        const result = await deleteExam(exam.id);
        setIsDeleting(false);
        if (result?.success) {
            setDeleteModalOpen(false);
            router.push("/dashboard/manajemen-ujian");
            router.refresh();
        } else {
            alert(result?.message ?? "Gagal menghapus ujian.");
        }
    };

    const handleArchive = async () => {
        setMenuOpen(false);
        setIsArchiving(true);
        const result = await toggleExamArchive(exam.id);
        setIsArchiving(false);
        if (result?.success) router.refresh();
        else alert(result?.message);
    };

    const handleDuplicate = async () => {
        setMenuOpen(false);
        setIsDuplicating(true);
        const result = await duplicateExam(exam.id);
        setIsDuplicating(false);
        if (result?.success) router.refresh();
        else alert(result?.message);
    };

    const openDeleteModal = () => {
        setMenuOpen(false);
        setDeleteModalOpen(true);
    };

    const typeLabel = exam.type === "FIXED" ? "Standar" : "Adaptif";
    const avgDisplay = stats.avgScore != null ? stats.avgScore.toFixed(1) : "—";

    const scoresForChart = participants
        .map((p) => p.score)
        .filter((s): s is number => s != null);
    const buckets = [0, 0, 0, 0, 0];
    const maxScore = 100;
    scoresForChart.forEach((s) => {
        const i = Math.min(4, Math.floor((s / maxScore) * 5));
        buckets[i]++;
    });
    const maxBucket = Math.max(1, ...buckets);
    const labels = ["0–20", "21–40", "41–60", "61–80", "81–100"];

    return (
        <>
            <header className="space-y-3">
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 ring-1 transition-colors
                            ${exam.isActive
                                ? "bg-emerald-500/15 text-emerald-700 ring-emerald-400/50"
                                : "bg-neutral-warm/40 text-text-dark/60 ring-neutral-warm/50"
                            }`}
                    >
                        {exam.isActive ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
                        ) : (
                            <Circle className="w-3 h-3 text-text-dark/50" aria-hidden />
                        )}
                        {exam.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((o) => !o)}
                            className="p-2 rounded-lg text-text-dark/70 hover:text-text-dark hover:bg-neutral-warm/20 transition-colors"
                            aria-label="Menu"
                            aria-expanded={menuOpen}
                            aria-haspopup="true"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        {menuOpen && (
                            <div
                                className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-xl border border-neutral-warm/40 shadow-md z-10"
                                role="menu"
                            >
                                <Link
                                    href={`/dashboard/manajemen-ujian/edit/${exam.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-neutral-light"
                                    role="menuitem"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleDuplicate}
                                    disabled={isDuplicating}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-neutral-light disabled:opacity-50"
                                    role="menuitem"
                                >
                                    <Copy className="w-4 h-4" />
                                    {isDuplicating ? "…" : "Duplicate"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleArchive}
                                    disabled={isArchiving}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-neutral-light disabled:opacity-50"
                                    role="menuitem"
                                >
                                    {exam.isActive ? (
                                        <>
                                            <Archive className="w-4 h-4" />
                                            {isArchiving ? "…" : "Arsipkan"}
                                        </>
                                    ) : (
                                        <>
                                            <ArchiveRestore className="w-4 h-4" />
                                            {isArchiving ? "…" : "Aktifkan"}
                                        </>
                                    )}
                                </button>
                                <hr className="my-1 border-neutral-warm/20" />
                                <button
                                    type="button"
                                    onClick={openDeleteModal}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    role="menuitem"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <h1 className="text-[20px] sm:text-[24px] font-bold text-text-dark">
                    {exam.title}
                </h1>
                <p className="text-sm text-text-dark/70">{typeLabel}</p>
            </header>

            <section className="mt-6" aria-label="Metadata">
                <h2 className="text-xs font-semibold text-text-dark/60 uppercase tracking-wide mb-3">
                    Metadata
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-dark/60 font-medium">Durasi</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2 tabular-nums">{exam.duration}</p>
                            <p className="text-xs text-text-dark/50 mt-1">Menit</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                            <Clock className="w-6 h-6 text-blue-600" aria-hidden />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-dark/60 font-medium">Soal</p>
                            <p className="text-3xl font-bold text-violet-600 mt-2 tabular-nums">{questionCount}</p>
                        </div>
                        <div className="p-3 bg-violet-100 rounded-lg shrink-0">
                            <FileQuestion className="w-6 h-6 text-violet-600" aria-hidden />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-dark/60 font-medium">Peserta</p>
                            <p className="text-3xl font-bold text-green-600 mt-2 tabular-nums">{participantCount}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg shrink-0">
                            <Users className="w-6 h-6 text-green-600" aria-hidden />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-dark/60 font-medium">Rata-rata</p>
                            <p className="text-3xl font-bold text-amber-600 mt-2 tabular-nums">{avgDisplay}</p>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-lg shrink-0">
                            <BarChart2 className="w-6 h-6 text-amber-600" aria-hidden />
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8" aria-label="Detail">
                <h2 className="text-xs font-semibold text-text-dark/60 uppercase tracking-wide mb-3">
                    Detail
                </h2>
                <nav className="flex flex-wrap gap-2" aria-label="Tab navigasi">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200
                            ${activeTab === tab.id
                                ? "bg-accent-earthy text-white shadow-sm"
                                : "bg-white border border-neutral-warm/30 text-text-dark/70 hover:text-text-dark hover:bg-neutral-warm/20 hover:border-neutral-warm/40"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="pt-6 min-h-[200px]">
                {activeTab === "ringkasan" && (
                    <div className="grid gap-6 sm:grid-cols-2 items-stretch">
                        <section className="rounded-xl border border-neutral-warm/20 bg-white p-6 shadow-sm flex flex-col min-h-0">
                            <h2 className="text-sm font-semibold text-text-dark mb-3">
                                Deskripsi
                            </h2>
                            <hr className="border-neutral-warm/40 mb-4" />
                            <p className="text-sm text-text-dark/80 whitespace-pre-wrap leading-relaxed flex-1 min-h-0">
                                {exam.description?.trim() || "Tidak ada deskripsi."}
                            </p>
                        </section>
                        <section className="rounded-xl border border-neutral-warm/20 bg-white p-6 shadow-sm flex flex-col min-h-0">
                            <h2 className="text-sm font-semibold text-text-dark mb-3">
                                Detail
                            </h2>
                            <hr className="border-neutral-warm/40 mb-4" />
                            <dl className="space-y-0">
                                <div className="flex items-center gap-3 py-3 border-b border-neutral-warm/30">
                                    <Clock className="w-4 h-4 text-accent-earthy shrink-0" aria-hidden />
                                    <dt className="text-sm text-text-dark/60 w-32 shrink-0">Durasi</dt>
                                    <dd className="text-sm font-medium text-text-dark">{exam.duration} Menit</dd>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-b border-neutral-warm/30">
                                    <ListOrdered className="w-4 h-4 text-accent-earthy shrink-0" aria-hidden />
                                    <dt className="text-sm text-text-dark/60 w-32 shrink-0">Mode Soal</dt>
                                    <dd className="text-sm font-medium text-text-dark">{typeLabel}</dd>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-b border-neutral-warm/30">
                                    <Tag className="w-4 h-4 text-accent-earthy shrink-0" aria-hidden />
                                    <dt className="text-sm text-text-dark/60 w-32 shrink-0">Kategori</dt>
                                    <dd className="text-sm font-medium text-text-dark">{exam.category || "—"}</dd>
                                </div>
                                <div className="flex items-center gap-3 py-3 border-b border-neutral-warm/30">
                                    <Calendar className="w-4 h-4 text-accent-earthy shrink-0" aria-hidden />
                                    <dt className="text-sm text-text-dark/60 w-32 shrink-0">Dibuat</dt>
                                    <dd className="text-sm font-medium text-text-dark">{formatDate(exam.createdAt)}</dd>
                                </div>
                                <div className="flex items-center gap-3 py-3">
                                    <RefreshCw className="w-4 h-4 text-accent-earthy shrink-0" aria-hidden />
                                    <dt className="text-sm text-text-dark/60 w-32 shrink-0">Terakhir update</dt>
                                    <dd className="text-sm font-medium text-text-dark">{formatDate(exam.updatedAt)}</dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                )}

                {activeTab === "soal" && (
                    <section>
                        <h2 className="text-sm font-semibold text-text-dark/80 mb-3">
                            Daftar Soal ({questionsList.length})
                        </h2>
                        <ul className="divide-y divide-neutral-warm/30 border border-neutral-warm/40 rounded-xl overflow-hidden bg-white shadow-sm">
                            {questionsList.length === 0 ? (
                                <li className="px-4 py-6 text-center text-sm text-text-dark/60">
                                    Belum ada soal.
                                </li>
                            ) : (
                                questionsList.map((q, i) => (
                                    <li
                                        key={q.id}
                                        className="px-4 py-3 text-sm text-text-dark flex gap-2"
                                    >
                                        <span className="font-medium text-text-dark/70 shrink-0">
                                            {i + 1}.
                                        </span>
                                        <span className="line-clamp-1">
                                            {q.content ? stripHtml(q.content) : "—"}
                                        </span>
                                    </li>
                                ))
                            )}
                        </ul>
                        <Link
                            href={`/dashboard/manajemen-ujian/edit/${exam.id}`}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 text-sm font-medium text-accent-earthy border border-accent-earthy/50 rounded-xl hover:bg-accent-earthy/10 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Soal
                        </Link>
                    </section>
                )}

                {activeTab === "peserta" && (
                    <section className="border border-neutral-warm/40 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-warm/30 bg-neutral-light/30">
                                        <th className="text-left font-semibold text-text-dark px-4 py-3">
                                            Nama
                                        </th>
                                        <th className="text-left font-semibold text-text-dark px-4 py-3">
                                            Nilai
                                        </th>
                                        <th className="text-left font-semibold text-text-dark px-4 py-3">
                                            Status
                                        </th>
                                        <th className="text-left font-semibold text-text-dark px-4 py-3">
                                            Waktu
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-text-dark/60">
                                                Belum ada peserta.
                                            </td>
                                        </tr>
                                    ) : (
                                        participants.map((p, i) => (
                                            <tr
                                                key={i}
                                                className="border-b border-neutral-warm/20 last:border-0"
                                            >
                                                <td className="px-4 py-3 text-text-dark">{p.name}</td>
                                                <td className="px-4 py-3 tabular-nums text-text-dark">
                                                    {p.score != null ? p.score : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-text-dark/80">{p.status}</td>
                                                <td className="px-4 py-3 tabular-nums text-text-dark/80">
                                                    {p.durationMinutes != null ? `${p.durationMinutes}m` : "—"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === "statistik" && (
                    <div className="space-y-8">
                        <section className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-neutral-warm/40 bg-white p-5 shadow-sm">
                                <p className="text-xs text-text-dark/60 font-medium">Rata-rata Nilai</p>
                                <p className="text-2xl font-extrabold text-accent-earthy tabular-nums mt-1">
                                    {stats.avgScore != null ? stats.avgScore.toFixed(1) : "—"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-neutral-warm/40 bg-white p-5 shadow-sm">
                                <p className="text-xs text-text-dark/60 font-medium">Nilai Tertinggi</p>
                                <p className="text-2xl font-extrabold text-accent-earthy tabular-nums mt-1">
                                    {stats.maxScore ?? "—"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-neutral-warm/40 bg-white p-5 shadow-sm">
                                <p className="text-xs text-text-dark/60 font-medium">Nilai Terendah</p>
                                <p className="text-2xl font-extrabold text-accent-earthy tabular-nums mt-1">
                                    {stats.minScore ?? "—"}
                                </p>
                            </div>
                        </section>
                        <section>
                            <h3 className="text-sm font-semibold text-text-dark/80 mb-3">
                                Distribusi Nilai
                            </h3>
                            <div className="rounded-xl border border-neutral-warm/40 bg-white p-5 shadow-sm">
                                <div className="flex items-end gap-2 h-36">
                                    {labels.map((label, i) => (
                                        <div
                                            key={label}
                                            className="flex-1 flex flex-col items-center gap-1.5"
                                        >
                                            <div
                                                className="w-full rounded-t bg-accent-earthy/50 min-h-[4px] transition-all"
                                                style={{
                                                    height: `${Math.max(4, (buckets[i] / maxBucket) * 120)}px`,
                                                }}
                                            />
                                            <span className="text-[10px] text-text-dark/60">
                                                {label}
                                            </span>
                                            <span className="text-xs font-medium text-text-dark tabular-nums">
                                                {buckets[i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "pengaturan" && (
                    <section className="rounded-xl border border-neutral-warm/40 bg-white p-6 shadow-sm">
                        <p className="text-sm text-text-dark/70 mb-4">
                            Ubah judul, durasi, soal, kategori, dan status ujian di halaman edit.
                        </p>
                        <Link
                            href={`/dashboard/manajemen-ujian/edit/${exam.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent-earthy rounded-xl hover:opacity-90 transition-opacity"
                        >
                            <Pencil className="w-4 h-4" />
                            Buka Pengaturan (Edit Ujian)
                        </Link>
                    </section>
                )}
            </div>
            </section>

            <DeleteExamModal
                open={deleteModalOpen}
                examTitle={exam.title}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
}
