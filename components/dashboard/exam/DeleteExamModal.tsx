"use client";

import { useEffect, useRef } from "react";

interface DeleteExamModalProps {
    open: boolean;
    examTitle: string;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export default function DeleteExamModal({
    open,
    examTitle,
    onClose,
    onConfirm,
    isDeleting = false,
}: DeleteExamModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) {
            cancelRef.current?.focus();
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-exam-title"
            aria-describedby="delete-exam-desc"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl border border-neutral-warm/20 max-w-md w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 id="delete-exam-title" className="text-lg font-bold text-text-dark flex items-center gap-2">
                        <span className="text-red-500" aria-hidden>⚠️</span>
                        Hapus Ujian?
                    </h2>
                    <p id="delete-exam-desc" className="mt-2 text-sm text-text-dark/80">
                        Ujian &quot;{examTitle}&quot; akan dihapus permanen dan tidak bisa dikembalikan.
                    </p>
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-800">
                        <p className="font-medium">Dampak penghapusan:</p>
                        <ul className="mt-1 list-disc list-inside space-y-0.5 text-red-700">
                            <li>Paket soal ujian ini akan dihapus</li>
                            <li>Semua sesi ujian peserta (sedang/selesai) akan ikut terhapus</li>
                            <li>Nilai dan riwayat ujian peserta untuk ujian ini akan hilang</li>
                        </ul>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-neutral-warm/20 bg-neutral-light/20 flex justify-end gap-3">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg border border-neutral-warm/40 bg-white text-text-dark font-medium hover:bg-neutral-warm/10 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? "Menghapus…" : "Ya, Hapus"}
                    </button>
                </div>
            </div>
        </div>
    );
}
