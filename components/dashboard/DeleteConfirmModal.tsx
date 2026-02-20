"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    /** Potongan konten yang akan dihapus (soal/materi) untuk konteks */
    previewText?: string;
    /** Teks peringatan tambahan (mis. "Tindakan ini tidak dapat dibatalkan.") */
    irreversibleHint?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isPending?: boolean;
}

export default function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    previewText,
    irreversibleHint,
    confirmLabel = "Hapus",
    cancelLabel = "Batal",
    isPending = false,
}: DeleteConfirmModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (open) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-desc"
        >
            <div
                className="absolute inset-0 bg-black/50 animate-delete-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative w-full max-w-sm animate-delete-modal rounded-xl border border-neutral-warm/20 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col items-center gap-6 px-6 py-7 text-center sm:px-7 sm:py-8 min-w-0">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
                        aria-hidden
                    >
                        <AlertTriangle className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="space-y-4 min-w-0 w-full">
                        <h2
                            id="delete-modal-title"
                            className="text-lg font-semibold text-text-dark px-0.5 break-words"
                        >
                            {title}
                        </h2>
                        {previewText && (
                            <div className="rounded-lg border border-neutral-warm/30 bg-neutral-light/30 px-3 py-3 text-left min-w-0 overflow-hidden">
                                <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide mb-1.5">
                                    Yang akan dihapus
                                </p>
                                <p className="text-sm text-text-dark line-clamp-3 break-words whitespace-normal">
                                    &ldquo;{previewText}&rdquo;
                                </p>
                            </div>
                        )}
                        <p
                            id="delete-modal-desc"
                            className="text-sm text-text-dark/70 text-left w-full max-w-full min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]"
                        >
                            {description}
                        </p>
                        {irreversibleHint && (
                            <p className="text-xs text-amber-700/90 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 text-left flex items-center gap-2 min-w-0 break-words">
                                <span className="shrink-0" aria-hidden>⚠</span>
                                <span>{irreversibleHint}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex w-full gap-4 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="flex-1 rounded-lg border border-neutral-warm/40 bg-white px-4 py-2.5 text-sm font-medium text-text-dark transition-colors hover:bg-neutral-light/50 disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isPending}
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                    <span>Menghapus…</span>
                                </>
                            ) : (
                                confirmLabel
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
