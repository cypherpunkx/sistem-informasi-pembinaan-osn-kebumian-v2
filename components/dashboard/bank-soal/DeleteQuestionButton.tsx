"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

const PREVIEW_MAX_LENGTH = 80;

const DEFAULT_DESCRIPTION = "Tindakan ini tidak dapat dibatalkan.";

function formatUsedInExamsDescription(examCount: number): string {
    return `Soal ini sedang digunakan pada ${examCount} ujian aktif. Menghapus soal akan mengeluarkannya dari ujian tersebut.`;
}

export default function DeleteQuestionButton({
    questionId,
    contentPreview,
    onDelete,
    getExamUsage,
}: {
    questionId: number;
    /** Potongan teks soal untuk ditampilkan di modal konfirmasi */
    contentPreview?: string;
    onDelete: (id: number) => Promise<{ success: boolean; message?: string }>;
    /** Untuk menampilkan peringatan jika soal dipakai di ujian */
    getExamUsage?: (id: number) => Promise<{ examCount: number }>;
}) {
    const [open, setOpen] = useState(false);
    const [examCount, setExamCount] = useState(0);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!open || !getExamUsage) {
            if (!open) setExamCount(0);
            return;
        }
        getExamUsage(questionId).then(({ examCount: n }) => setExamCount(n));
    }, [open, questionId, getExamUsage]);

    const preview =
        contentPreview != null
            ? contentPreview.length > PREVIEW_MAX_LENGTH
                ? contentPreview.slice(0, PREVIEW_MAX_LENGTH).trim() + "…"
                : contentPreview
            : undefined;

    const description =
        examCount > 0
            ? formatUsedInExamsDescription(examCount)
            : DEFAULT_DESCRIPTION;

    const handleConfirm = () => {
        startTransition(async () => {
            const result = await onDelete(questionId);
            setOpen(false);
            if (!result.success && result.message) {
                alert(result.message);
            } else if (result.success && result.message) {
                alert(result.message);
            }
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={isPending}
                className="text-text-dark/60 hover:text-red-600 disabled:opacity-50"
                title="Hapus soal"
            >
                <Trash2 className="h-4 w-4" />
            </button>
            <DeleteConfirmModal
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={handleConfirm}
                title="Hapus soal?"
                description={description}
                previewText={preview}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                isPending={isPending}
                irreversibleHint="Tindakan ini tidak dapat dibatalkan."
            />
        </>
    );
}
