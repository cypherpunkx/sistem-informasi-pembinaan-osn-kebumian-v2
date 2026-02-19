"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

const PREVIEW_MAX_LENGTH = 80;

export default function DeleteQuestionButton({
    questionId,
    contentPreview,
    onDelete,
}: {
    questionId: number;
    /** Potongan teks soal untuk ditampilkan di modal konfirmasi */
    contentPreview?: string;
    onDelete: (id: number) => Promise<{ success: boolean; message?: string }>;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const preview =
        contentPreview != null
            ? contentPreview.length > PREVIEW_MAX_LENGTH
                ? contentPreview.slice(0, PREVIEW_MAX_LENGTH).trim() + "…"
                : contentPreview
            : undefined;

    const handleConfirm = () => {
        startTransition(async () => {
            await onDelete(questionId);
            setOpen(false);
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
                description="Tindakan ini tidak dapat dibatalkan."
                previewText={preview}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                isPending={isPending}
            />
        </>
    );
}
