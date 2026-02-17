"use client";

import { useState } from "react";
import { User, Mail, Lock, Bell, Save, RotateCcw } from "lucide-react";
import { updateProfile } from "@/app/actions/auth";

interface ProfileFormProps {
    user: {
        name?: string | null;
        email?: string | null;
        school?: string | null;
    };
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        school: user.school || "",
        currentPassword: "",
        newPassword: "",
        notifications: true,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const result = await updateProfile({
                name: formData.name,
                email: formData.email,
                school: formData.school,
                currentPassword: formData.currentPassword || undefined,
                newPassword: formData.newPassword || undefined,
            });

            if (result.success) {
                setMessage({ type: "success", text: result.message });
                // Clear password fields on success
                setFormData(prev => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                }));

                // Reload page after 1.5s to reflect changes
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setMessage({ type: "error", text: result.message });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-accent-earthy" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">School / Institution</label>
                        <input
                            type="text"
                            name="school"
                            value={formData.school}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-dark mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-accent-earthy" /> Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Leave blank to keep current"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-accent-earthy focus:border-accent-earthy"
                        />
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-accent-earthy" /> Preferences
                </h3>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        name="notifications"
                        id="notifications"
                        checked={formData.notifications}
                        onChange={handleChange}
                        className="h-4 w-4 text-accent-earthy focus:ring-accent-earthy border-gray-300 rounded"
                    />
                    <label htmlFor="notifications" className="text-sm text-text-dark">
                        Receive email notifications about exam schedules and new materials.
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors disabled:opacity-70"
                >
                    {isLoading ? "Saving..." : (
                        <>
                            <Save className="w-4 h-4" /> Save Changes
                        </>
                    )}
                </button>
                <button
                    type="button"
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-neutral-warm/30 text-text-dark font-medium rounded-lg hover:bg-neutral-light transition-colors"
                    onClick={() => window.location.reload()}
                >
                    <RotateCcw className="w-4 h-4" /> Reset
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </form>
    );
}
