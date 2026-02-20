"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { createNews, updateNews, checkNewsSlugAvailable } from "@/app/actions/news";
import { NEWS_CATEGORIES } from "@/lib/news-categories";
import RichTextEditor from "./RichTextEditor";

const SLUG_PREFIX = "osn.id/news/";

interface NewsFormProps {
    mode: "create" | "edit";
    id?: number;
    initial?: {
        title: string;
        slug: string;
        category: string | null;
        thumbnailUrl: string | null;
        summary: string | null;
        content: string | null;
        status: "DRAFT" | "PUBLISHED";
        seoTitle: string | null;
        seoDescription: string | null;
    };
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debouncedValue;
}

export default function NewsForm({ mode, id, initial }: NewsFormProps) {
    const router = useRouter();
    const [slug, setSlug] = useState(initial?.slug ?? "");
    const [title, setTitle] = useState(initial?.title ?? "");
    const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
    const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initial?.status ?? "DRAFT");
    const [seoOpen, setSeoOpen] = useState(false);
    const [slugCheck, setSlugCheck] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const [submitting, setSubmitting] = useState(false);
    const contentInputRef = useRef<HTMLInputElement>(null);

    const debouncedSlug = useDebounce(slug, 400);

    const deriveSlug = useCallback((t: string) => {
        return t
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    }, []);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setTitle(v);
        if (mode === "create") setSlug(deriveSlug(v));
        setSlugCheck("idle");
    };

    useEffect(() => {
        const s = debouncedSlug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (!s) {
            setSlugCheck("idle");
            return;
        }
        let cancelled = false;
        setSlugCheck("checking");
        checkNewsSlugAvailable(s, mode === "edit" ? id : undefined).then((available) => {
            if (cancelled) return;
            setSlugCheck(available ? "available" : "taken");
        });
        return () => { cancelled = true; };
    }, [debouncedSlug, mode, id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set("status", status);
        const slugVal = (formData.get("slug") as string)?.trim()?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
        formData.set("slug", slugVal);
        setSubmitting(true);
        try {
            if (mode === "create") {
                const res = await createNews(formData);
                if (res.success && res.id) {
                    router.push("/dashboard/news");
                    router.refresh();
                } else {
                    alert(res.message);
                }
            } else if (id) {
                const res = await updateNews(id, formData);
                if (res.success) {
                    router.push("/dashboard/news");
                    router.refresh();
                } else {
                    alert(res.message);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <form id="news-form" onSubmit={handleSubmit} className="max-w-2xl mx-auto pb-24">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-6">
                {/* ---------- Informasi Dasar ---------- */}
                <section className="mb-6">
                    <h2 className="text-sm font-semibold text-text-dark/80 uppercase tracking-wide border-b border-neutral-warm/30 pb-2 mb-4">
                        Informasi Dasar
                    </h2>

                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-medium text-text-dark">Judul Artikel</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={title}
                            onChange={handleTitleChange}
                            className="rounded-lg border border-neutral-warm/40 px-4 py-3 text-lg text-text-dark w-full"
                            placeholder="Judul artikel"
                        />
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-medium text-text-dark">Slug URL</label>
                        <div className="flex items-center gap-2 rounded-lg border border-neutral-warm/40 bg-neutral-light/30 px-4 py-2">
                            <span className="text-text-dark/60 text-sm whitespace-nowrap">{SLUG_PREFIX}</span>
                            <input
                                type="text"
                                name="slug"
                                required
                                value={slug}
                                onChange={(e) => { setSlug(e.target.value); setSlugCheck("idle"); }}
                                className="flex-1 bg-transparent text-text-dark outline-none min-w-0"
                                placeholder="contoh-artikel"
                            />
                            <button
                                type="button"
                                onClick={() => setSlug(deriveSlug(title))}
                                className="flex items-center gap-1 text-xs text-accent-earthy hover:underline shrink-0"
                                title="Generate dari judul"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Generate
                            </button>
                        </div>
                        <p className="text-xs text-text-dark/50">
                            Preview: <span className="font-mono">{SLUG_PREFIX}{slug || "..."}</span>
                        </p>
                        {slug.trim() && slugCheck !== "idle" && (
                            <p className={`text-xs ${slugCheck === "checking" ? "text-text-dark/50" : slugCheck === "available" ? "text-green-600" : "text-red-600"}`}>
                                {slugCheck === "checking" ? "Memeriksa slug..." : slugCheck === "available" ? "Slug tersedia" : "Slug sudah dipakai"}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-medium text-text-dark">Kategori</label>
                        <select
                            name="category"
                            defaultValue={initial?.category ?? ""}
                            className="rounded-lg border border-neutral-warm/40 px-4 py-2 text-text-dark w-full bg-white"
                        >
                            <option value="">— Pilih kategori (opsional) —</option>
                            {NEWS_CATEGORIES.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-medium text-text-dark">Thumbnail</label>
                        <div className="flex flex-col gap-2">
                            <input
                                type="url"
                                name="thumbnailUrl"
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                className="rounded-lg border border-neutral-warm/40 px-4 py-2 text-text-dark w-full"
                                placeholder="https://... atau kosongkan"
                            />
                            {thumbnailUrl && (
                                <div className="rounded-lg border border-neutral-warm/20 overflow-hidden bg-neutral-warm/10 w-full max-w-xs aspect-video flex items-center justify-center">
                                    <img
                                        src={thumbnailUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-text-dark">Status</label>
                        <input type="hidden" name="status" value={status} />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStatus("DRAFT")}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${status === "DRAFT" ? "border-accent-earthy bg-accent-earthy/10 text-accent-earthy" : "border-neutral-warm/40 bg-white text-text-dark/70 hover:bg-neutral-light"}`}
                            >
                                Draf
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus("PUBLISHED")}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${status === "PUBLISHED" ? "border-accent-earthy bg-accent-earthy text-white" : "border-neutral-warm/40 bg-white text-text-dark/70 hover:bg-neutral-light"}`}
                            >
                                Diterbitkan
                            </button>
                        </div>
                        <p className="text-xs text-text-dark/50">Simpan sebagai draf atau terbitkan. Tombol di bawah form akan mengirim sesuai status ini.</p>
                    </div>
                </section>

                {/* ---------- Konten Artikel ---------- */}
                <section className="mb-6">
                    <h2 className="text-sm font-semibold text-text-dark/80 uppercase tracking-wide border-b border-neutral-warm/30 pb-2 mb-4">
                        Konten Artikel
                    </h2>

                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-medium text-text-dark">Ringkasan</label>
                        <textarea
                            name="summary"
                            rows={3}
                            defaultValue={initial?.summary ?? ""}
                            className="rounded-lg border border-neutral-warm/40 px-4 py-2 text-text-dark w-full"
                            placeholder="Ringkasan singkat artikel"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-text-dark">Konten</label>
                        <input
                            type="hidden"
                            name="content"
                            ref={contentInputRef}
                            defaultValue={initial?.content ?? ""}
                        />
                        <RichTextEditor
                            initialContent={initial?.content ?? ""}
                            onContentChange={(html) => {
                                if (contentInputRef.current) contentInputRef.current.value = html;
                            }}
                            placeholder="Tulis konten artikel…"
                        />
                    </div>
                </section>

                {/* ---------- SEO (collapsible) ---------- */}
                <section>
                    <button
                        type="button"
                        onClick={() => setSeoOpen((o) => !o)}
                        className="flex items-center gap-2 w-full text-left text-sm font-semibold text-text-dark/80 uppercase tracking-wide border-b border-neutral-warm/30 pb-2 mb-4 hover:text-text-dark"
                    >
                        {seoOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        SEO Settings (opsional)
                    </button>
                    {seoOpen && (
                        <div className="space-y-4 pl-1">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-text-dark/80">SEO Title</label>
                                <input
                                    type="text"
                                    name="seoTitle"
                                    defaultValue={initial?.seoTitle ?? ""}
                                    className="rounded-lg border border-neutral-warm/40 px-4 py-2 text-text-dark w-full"
                                    placeholder="Judul untuk mesin pencari"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-text-dark/80">Meta Description</label>
                                <textarea
                                    name="seoDescription"
                                    rows={2}
                                    defaultValue={initial?.seoDescription ?? ""}
                                    className="rounded-lg border border-neutral-warm/40 px-4 py-2 text-text-dark w-full"
                                    placeholder="Deskripsi singkat untuk SEO"
                                />
                            </div>
                        </div>
                    )}
                </section>
                </div>
            </form>

            {/* Sticky action bar */}
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 border-t border-neutral-warm/20 py-3 px-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
                <div className="max-w-2xl mx-auto flex gap-3 justify-end">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            setStatus("DRAFT");
                            setTimeout(() => (document.getElementById("news-form") as HTMLFormElement)?.requestSubmit(), 0);
                        }}
                        className="px-5 py-2.5 rounded-lg border border-neutral-warm/40 bg-white text-text-dark font-medium hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Menyimpan…" : "Simpan Draft"}
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            setStatus("PUBLISHED");
                            setTimeout(() => (document.getElementById("news-form") as HTMLFormElement)?.requestSubmit(), 0);
                        }}
                        className="px-5 py-2.5 rounded-lg bg-accent-earthy text-white font-medium hover:bg-text-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Menerbitkan…" : "Publish"}
                    </button>
                </div>
            </div>
        </>
    );
}
