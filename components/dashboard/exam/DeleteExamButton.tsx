"use client";

import { Trash2 } from "lucide-react";
import { deleteExam } from "@/app/actions/exams";

interface DeleteExamButtonProps {
    id: number;
}

export default function DeleteExamButton({ id }: DeleteExamButtonProps) {
    const handleDelete = async (e: React.FormEvent) => {
        if (!confirm("Are you sure you want to delete this exam?")) {
            e.preventDefault();
        }
    };

    return (
        <form action={async () => {
            const result = await deleteExam(id);
            if (!result.success) {
                alert(result.message);
            }
        }}>
            <button
                type="submit"
                onClick={(e) => handleDelete(e)}
                className="p-2 text-text-dark/60 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                title="Delete"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </form>
    );
}
