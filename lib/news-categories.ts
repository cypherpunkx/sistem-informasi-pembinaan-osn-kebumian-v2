/** Nilai slug kategori untuk tabel news (simpan di DB). */
export type NewsCategorySlug =
    | "pengumuman"
    | "jadwal"
    | "hasil"
    | "materi"
    | "info_teknis"
    | "dokumentasi";

/** Label tampilan per kategori (untuk filter bar & badge). */
export const NEWS_CATEGORY_LABELS: Record<NewsCategorySlug, string> = {
    pengumuman: "Pengumuman Resmi",
    jadwal: "Jadwal Seleksi",
    hasil: "Hasil Tahap 1",
    materi: "Materi Persiapan",
    info_teknis: "Info Teknis",
    dokumentasi: "Dokumentasi",
};

export const NEWS_CATEGORIES: { value: NewsCategorySlug; label: string }[] = [
    { value: "pengumuman", label: "Pengumuman Resmi" },
    { value: "jadwal", label: "Jadwal Seleksi" },
    { value: "hasil", label: "Hasil Tahap 1" },
    { value: "materi", label: "Materi Persiapan" },
    { value: "info_teknis", label: "Info Teknis" },
    { value: "dokumentasi", label: "Dokumentasi" },
];

export function getNewsCategoryLabel(slug: string | null): string {
    if (!slug) return "Umum";
    return NEWS_CATEGORY_LABELS[slug as NewsCategorySlug] ?? slug;
}
