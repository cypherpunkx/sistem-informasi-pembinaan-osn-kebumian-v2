"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { deleteUser } from "@/app/actions/users";
import { X, Loader2, AlertTriangle } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "pembina" | "peserta";
}

interface DeleteUserDialogProps {
    user: User;
    onClose: () => void;
    onUserDeleted: () => void;
}

export default function DeleteUserDialog({ user, onClose, onUserDeleted }: DeleteUserDialogProps) {
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleDelete = () => {
        setError(null);
        startTransition(async () => {
            const result = await deleteUser(user.id);
            if (result.success) {
                setTimeout(() => {
                    onUserDeleted();
                }, 500);
            } else {
                setError(result.message);
            }
        });
    };

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-warm/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-text-dark">Delete User</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="p-2 hover:bg-neutral-light rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-text-dark">
                        Are you sure you want to delete this user? This action cannot be undone.
                    </p>

                    <div className="p-4 bg-neutral-light/50 rounded-lg border border-neutral-warm/20">
                        <p className="text-sm font-semibold text-text-dark">{user.name}</p>
                        <p className="text-sm text-text-dark/60">{user.email}</p>
                        <span
                            className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded uppercase ${user.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : user.role === "pembina"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                        >
                            {user.role}
                        </span>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-neutral-warm/20">
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete User"
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 border border-neutral-warm/30 text-text-dark rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
