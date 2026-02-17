"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createUser } from "@/app/actions/users";
import { X, Loader2, Save } from "lucide-react";

interface AddUserModalProps {
    onClose: () => void;
    onUserAdded: () => void;
}

export default function AddUserModal({ onClose, onUserAdded }: AddUserModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "peserta" as "admin" | "pembina" | "peserta",
        school: "",
        contact: "",
        competitionCategory: "",
    });

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.email || !formData.password) {
            setError("Name, email, and password are required");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        startTransition(async () => {
            const result = await createUser(formData);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onUserAdded();
                }, 1000);
            } else {
                setError(result.message);
            }
        });
    };

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-warm/20">
                    <h2 className="text-2xl font-bold text-text-dark">Add New User</h2>
                    <button
                        onClick={onClose}
                        disabled={isPending || success}
                        className="p-2 hover:bg-neutral-light rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">
                            Name <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">
                            Email <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">
                            Password <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                            minLength={6}
                            required
                        />
                        <p className="text-xs text-text-dark/50 mt-1">Minimum 6 characters</p>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">
                            Role <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    role: e.target.value as "admin" | "pembina" | "peserta",
                                })
                            }
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                            required
                        >
                            <option value="peserta">Peserta</option>
                            <option value="pembina">Pembina</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* School */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">School</label>
                        <input
                            type="text"
                            value={formData.school}
                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                        />
                    </div>

                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">Contact</label>
                        <input
                            type="text"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                        />
                    </div>

                    {/* Competition Category */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">
                            Competition Category
                        </label>
                        <input
                            type="text"
                            value={formData.competitionCategory}
                            onChange={(e) => setFormData({ ...formData, competitionCategory: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            disabled={isPending || success}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">✓ User created successfully!</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={isPending || success}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create User
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending || success}
                            className="px-4 py-2 border border-neutral-warm/30 text-text-dark rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
