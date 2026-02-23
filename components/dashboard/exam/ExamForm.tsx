"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { createFixedExam, updateFixedExam, createDynamicExam, updateDynamicExam } from "@/app/actions/exams";
import { useRouter } from "next/navigation";
import QuestionSelector from "@/components/dashboard/exam/QuestionSelector";

/** Format Date untuk input datetime-local (yyyy-MM-ddThh:mm) */
function toDateTimeLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
}

function formatOptionalDatetime(v: Date | string | null | undefined): string {
    if (v == null) return "";
    const d = typeof v === "string" ? new Date(v) : v;
    return isNaN(d.getTime()) ? "" : toDateTimeLocal(d);
}

type ExamType = "FIXED" | "DYNAMIC";
const DIFFICULTIES: ("EASY" | "MEDIUM" | "HARD")[] = ["EASY", "MEDIUM", "HARD"];

/** Fallback bila belum ada kategori di database. */
const DEFAULT_CATEGORIES = ["Latihan", "Latihan Topik", "Try Out", "Simulasi", "OSN Kabupaten", "OSN Provinsi", "OSN Nasional"];

interface ExamFormProps {
    initialData?: {
        id: number;
        type?: ExamType;
        title: string;
        description: string | null;
        duration: number;
        category: string | null;
        isActive: boolean | null;
        availableStart?: Date | string | null;
        availableEnd?: Date | string | null;
        questions: { id: number | null }[];
        filterConfig?: { topics?: string[]; difficulties?: ("EASY" | "MEDIUM" | "HARD")[]; questionCount: number } | null;
    };
    topics?: string[];
    /** Kategori dari database (getDistinctExamCategories). Kosong pakai DEFAULT_CATEGORIES. */
    categories?: string[];
}

export default function ExamForm({ initialData, topics = [], categories = [] }: ExamFormProps) {
    const categoryOptions = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const router = useRouter();
    const isEdit = !!initialData?.id;
    const [examTypeState, setExamTypeState] = useState<ExamType>(initialData?.type ?? "FIXED");
    const examType: ExamType = isEdit ? (initialData!.type ?? "FIXED") : examTypeState;

    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(
        initialData?.questions?.map((q) => q.id).filter((id): id is number => id != null) ?? []
    );
    const [questionCount, setQuestionCount] = useState(initialData?.filterConfig?.questionCount ?? 10);
    const [selectedTopics, setSelectedTopics] = useState<string[]>(initialData?.filterConfig?.topics ?? []);
    const [selectedDifficulties, setSelectedDifficulties] = useState<("EASY" | "MEDIUM" | "HARD")[]>(
        initialData?.filterConfig?.difficulties ?? []
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (!formData.get("isActive")) formData.set("isActive", "off");

        if (examType === "DYNAMIC") {
            formData.set("questionCount", String(questionCount));
            formData.set("topics", selectedTopics.join(","));
            formData.set("difficulties", selectedDifficulties.join(","));
        } else {
            if (selectedQuestionIds.length === 0) {
                alert("Pilih minimal satu soal untuk paket tetap.");
                return;
            }
            formData.set("questionIds", selectedQuestionIds.join(","));
        }

        setIsLoading(true);
        let result;
        if (examType === "DYNAMIC") {
            if (initialData?.id) result = await updateDynamicExam(initialData.id, formData);
            else result = await createDynamicExam(null, formData);
        } else {
            if (initialData?.id) result = await updateFixedExam(initialData.id, formData);
            else result = await createFixedExam(null, formData);
        }

        if (result?.success) {
            router.push("/dashboard/manajemen-ujian");
            router.refresh();
        } else {
            alert(result?.message || "Gagal menyimpan");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            {!isEdit && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                    <h3 className="font-bold text-text-dark mb-2">Tipe ujian</h3>
                    <p className="text-sm text-text-dark/60 mb-3">
                        {examType === "FIXED"
                            ? "Paket tetap: soal yang ditampilkan sudah ditentukan oleh Anda."
                            : "Paket dinamis: soal diambil acak dari bank soal sesuai filter (topik, level, jumlah) saat peserta mulai."}
                    </p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setExamTypeState("FIXED")}
                            className={`px-4 py-2 rounded-lg border-2 ${examType === "FIXED" ? "border-accent-earthy bg-accent-earthy/10" : "border-neutral-warm/30 hover:bg-neutral-light"}`}
                        >
                            Paket tetap
                        </button>
                        <button
                            type="button"
                            onClick={() => setExamTypeState("DYNAMIC")}
                            className={`px-4 py-2 rounded-lg border-2 ${examType === "DYNAMIC" ? "border-accent-earthy bg-accent-earthy/10" : "border-neutral-warm/30 hover:bg-neutral-light"}`}
                        >
                            Paket dinamis
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4 h-fit">
                    <h3 className="font-bold text-lg text-text-dark">Detail ujian</h3>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Judul</label>
                        <input
                            type="text"
                            name="title"
                            defaultValue={initialData?.title}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            placeholder="e.g. Latihan topik Geologi, Latihan harian"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Deskripsi</label>
                        <textarea
                            name="description"
                            defaultValue={initialData?.description ?? ""}
                            rows={3}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            placeholder="Instruksi untuk peserta..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Durasi (menit)</label>
                            <input
                                type="number"
                                name="duration"
                                defaultValue={initialData?.duration ?? 60}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                min={1}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Kategori</label>
                            <select
                                name="category"
                                defaultValue={initialData?.category ?? "Latihan"}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white"
                            >
                                {initialData?.category && !categoryOptions.includes(initialData.category) && (
                                    <option value={initialData.category}>{initialData.category}</option>
                                )}
                                {categoryOptions.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <p className="text-xs text-text-dark/50 mt-0.5">Latihan = boleh berkali-kali; Try Out/Simulasi/OSN = satu kali per paket.</p>
                        </div>
                    </div>

                    {examType === "DYNAMIC" && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-text-dark mb-1">Jumlah soal (diambil acak saat mulai)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                                    className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-dark mb-1">Topik (kosongkan = semua)</label>
                                <select
                                    multiple
                                    className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg min-h-[100px]"
                                    value={selectedTopics}
                                    onChange={(e) => {
                                        const opts = Array.from(e.target.selectedOptions, (o) => o.value);
                                        setSelectedTopics(opts);
                                    }}
                                >
                                    {topics.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-text-dark/50 mt-0.5">Ctrl+klik untuk pilih banyak</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-dark mb-1">Tingkat kesulitan (kosongkan = semua)</label>
                                <div className="flex flex-wrap gap-3">
                                    {DIFFICULTIES.map((d) => (
                                        <label key={d} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedDifficulties.includes(d)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedDifficulties((prev) => [...prev, d]);
                                                    else setSelectedDifficulties((prev) => prev.filter((x) => x !== d));
                                                }}
                                                className="w-4 h-4 text-accent-earthy"
                                            />
                                            <span className="text-sm">{d}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Buka dari (opsional)</label>
                            <input
                                type="datetime-local"
                                name="availableStart"
                                defaultValue={formatOptionalDatetime(initialData?.availableStart)}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            />
                            <p className="text-xs text-text-dark/60 mt-0.5">Kosongkan = selalu bisa dibuka</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Tutup sampai (opsional)</label>
                            <input
                                type="datetime-local"
                                name="availableEnd"
                                defaultValue={formatOptionalDatetime(initialData?.availableEnd)}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            />
                            <p className="text-xs text-text-dark/60 mt-0.5">Kosongkan = tidak ada batas tutup</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            defaultChecked={initialData ? (initialData.isActive ?? true) : true}
                            className="w-4 h-4 text-accent-earthy"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-text-dark">Aktif (tampil untuk peserta)</label>
                    </div>
                </div>

                {examType === "FIXED" && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 h-fit">
                        <h3 className="font-bold text-text-dark mb-2">Pilih soal</h3>
                        <QuestionSelector selectedIds={selectedQuestionIds} onSelectionChange={setSelectedQuestionIds} />
                    </div>
                )}

                {examType === "DYNAMIC" && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 h-fit">
                        <h3 className="font-bold text-text-dark mb-2">Paket dinamis</h3>
                        <p className="text-sm text-text-dark/60">
                            Soal akan diambil secara acak dari bank soal sesuai filter (topik &amp; tingkat kesulitan) saat peserta mengklik &quot;Mulai ujian&quot;. Bukan sistem adaptif.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light">Batal</button>
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
        </form>
    );
}
