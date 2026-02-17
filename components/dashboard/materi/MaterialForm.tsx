"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { createMaterial, updateMaterial } from "@/app/actions/materials";
import { useRouter } from "next/navigation";



import StatusBadge from "../StatusBadge";

interface MaterialFormProps {
    initialData?: any;
    userRole?: string;
}

export default function MaterialForm({ initialData, userRole = "pembina" }: MaterialFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        let result;
        if (initialData?.id) {
            result = await updateMaterial(initialData.id, formData);
        } else {
            result = await createMaterial(null, formData);
        }

        if (result.success) {
            router.push("/dashboard/manajemen-materi");
            router.refresh();
        } else {
            alert(result.message || "Failed to save material");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-text-dark">Material Details</h2>
                    {initialData?.status && <StatusBadge status={initialData.status} />}
                </div>

                {/* Status Selection (Visible for editing or creating) */}
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Status</label>
                    <select
                        name="status"
                        defaultValue={initialData?.status || "DRAFT"}
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending Review</option>
                        {userRole === "admin" && (
                            <option value="PUBLISHED">Published</option>
                        )}
                        <option value="ARCHIVED">Archived</option>
                    </select>
                    {userRole !== "admin" && (
                        <p className="text-xs text-text-dark/40 mt-1">
                            * Submitting as "Published" will automatically set status to "Pending Review" for approval.
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Title</label>
                    <input
                        type="text"
                        name="title"
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        required
                        defaultValue={initialData?.title}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Topic</label>
                        <select
                            name="topic"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            defaultValue={initialData?.topic}
                        >
                            <option value="Geology">Geology</option>
                            <option value="Meteorology">Meteorology</option>
                            <option value="Astronomy">Astronomy</option>
                            <option value="Oceanography">Oceanography</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Type</label>
                        <select
                            name="type"
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            defaultValue={initialData?.type}
                        >
                            <option value="PDF">PDF</option>
                            <option value="VIDEO">Video</option>
                            <option value="SLIDE">Slide</option>
                            <option value="TEXT">Text</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">URL / Link</label>
                    <input
                        type="url"
                        name="url"
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        placeholder="https://..."
                        required
                        defaultValue={initialData?.url}
                    />
                    <p className="text-xs text-text-dark/50 mt-1">Link to external resource (Google Drive, YouTube, etc.)</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Tags</label>
                    <input
                        type="text"
                        name="tags"
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        placeholder="e.g. basics, advanced, 2023"
                        defaultValue={initialData?.tags?.join(", ")}
                    />
                    <p className="text-xs text-text-dark/50 mt-1">Comma separated</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Description</label>
                    <textarea
                        name="description"
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                        defaultValue={initialData?.description}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isLoading ? "Saving..." : "Save Material"}
                </button>
            </div>
        </form>
    );
}
