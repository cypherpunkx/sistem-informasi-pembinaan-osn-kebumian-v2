"use client";

import { useState } from "react";
import { Eye, X, Loader2, ExternalLink, Paperclip } from "lucide-react";
import { getMaterialById } from "@/app/actions/materials";

/** Ambil nama file/display dari URL (path terakhir) atau fallback. */
function urlDisplayName(url: string): string {
    try {
        const path = new URL(url).pathname;
        const segment = path.split("/").filter(Boolean).pop();
        return segment ? decodeURIComponent(segment) : "Link materi";
    } catch {
        return "Link materi";
    }
}

interface MaterialPreviewTriggerProps {
    materialId: number;
}

export default function MaterialPreviewTrigger({ materialId }: MaterialPreviewTriggerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [material, setMaterial] = useState<Awaited<ReturnType<typeof getMaterialById>>>(null);

    const handleOpen = async () => {
        setOpen(true);
        setLoading(true);
        setMaterial(null);
        try {
            const m = await getMaterialById(materialId);
            setMaterial(m);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="text-text-dark/60 hover:text-accent-earthy"
                title="Preview"
            >
                <Eye className="w-4 h-4" />
            </button>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-lg border border-neutral-warm/20 w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-warm/20">
                            <h2 className="text-lg font-bold text-text-dark">Preview Materi</h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1 rounded hover:bg-neutral-light text-text-dark/70"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-accent-earthy" />
                                </div>
                            )}
                            {!loading && !material && (
                                <p className="text-text-dark/60 py-8 text-center">Materi tidak ditemukan.</p>
                            )}
                            {!loading && material && (
                                <div className="space-y-5 text-sm">
                                    <div>
                                        <span className="text-xs font-semibold text-text-dark/40 uppercase tracking-wide">Judul</span>
                                        <p className="mt-1.5 text-base font-bold text-text-dark leading-snug">{material.title}</p>
                                    </div>
                                    {material.description && (
                                        <div>
                                            <span className="text-xs font-semibold text-text-dark/40 uppercase tracking-wide">Deskripsi</span>
                                            <p className="mt-1.5 text-text-dark/90 whitespace-pre-wrap leading-relaxed">{material.description}</p>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 rounded bg-neutral-100 text-text-dark/80 text-xs">{material.topic}</span>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                material.type === "PDF"
                                                    ? "bg-red-100 text-red-700"
                                                    : material.type === "VIDEO"
                                                      ? "bg-blue-100 text-blue-700"
                                                      : material.type === "SLIDE"
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-green-100 text-green-700"
                                            }`}
                                        >
                                            {material.type}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-neutral-100 text-text-dark/80 text-xs">{material.status}</span>
                                    </div>
                                    {Array.isArray(material.tags) && (material.tags as string[]).length > 0 && (
                                        <div>
                                            <span className="text-xs font-semibold text-text-dark/40 uppercase tracking-wide">Tags</span>
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                {(material.tags as string[]).map((tag, i) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 bg-neutral-warm/10 rounded-full text-text-dark/80">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-xs font-semibold text-text-dark/40 uppercase tracking-wide">Link</span>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            <a
                                                href={material.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-warm/20 bg-neutral-light/30 text-text-dark hover:bg-neutral-warm/10 transition-colors text-sm font-medium"
                                            >
                                                <Paperclip className="w-4 h-4 text-text-dark/50" />
                                                <span className="truncate max-w-[200px]" title={material.url}>
                                                    {urlDisplayName(material.url)}
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-text-dark/50 shrink-0" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
