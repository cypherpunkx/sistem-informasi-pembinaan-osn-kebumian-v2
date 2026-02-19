"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import DeleteConfirmModal from "@/components/dashboard/DeleteConfirmModal";

const PREVIEW_MAX_LENGTH = 80;

export default function DeleteMaterialButton({
    materialId,
    titlePreview,
    onDelete,
}: {
    materialId: number;
    /** Judul materi untuk ditampilkan di modal konfirmasi */
    titlePreview?: string;
    onDelete: (id: number) => Promise<{ message?: string }>;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const preview =
        titlePreview != null
            ? titlePreview.length > PREVIEW_MAX_LENGTH
                ? titlePreview.slice(0, PREVIEW_MAX_LENGTH).trim() + "…"
                : titlePreview
            : undefined;

    const handleConfirm = () => {
        startTransition(async () => {
            await onDelete(materialId);
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
                title="Hapus materi"
            >
                <Trash2 className="h-4 w-4" />
            </button>
            <DeleteConfirmModal
                open={open}
                onClose={() => setOpen(false)}
                onConfirm={handleConfirm}
                title="Hapus materi?"
                description="Tindakan ini tidak dapat dibatalkan."
                previewText={preview}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                isPending={isPending}
            />
        </>
    );
}
