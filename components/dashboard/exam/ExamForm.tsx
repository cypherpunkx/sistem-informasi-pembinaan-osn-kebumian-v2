"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { createFixedExam, updateFixedExam } from "@/app/actions/exams";
import { useRouter } from "next/navigation";
import QuestionSelector from "@/components/dashboard/exam/QuestionSelector";

interface ExamFormProps {
    initialData?: any;
}

export default function ExamForm({ initialData }: ExamFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(
        initialData?.questions?.map((q: any) => q.id) || []
    );

    useEffect(() => {
        console.log("ExamForm: initialData", initialData);
        console.log("ExamForm: selectedQuestionIds", selectedQuestionIds);
    }, [initialData, selectedQuestionIds]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (selectedQuestionIds.length === 0) {
            alert("Please select at least one question.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.set("questionIds", selectedQuestionIds.join(","));

        // Add checkbox
        if (!formData.get("isActive")) {
            formData.set("isActive", "off");
        }

        let result;
        if (initialData?.id) {
            result = await updateFixedExam(initialData.id, formData);
        } else {
            result = await createFixedExam(null, formData);
        }

        if (result.success) {
            router.push("/dashboard/manajemen-ujian");
            router.refresh();
        } else {
            alert(result.message || "Failed to save exam");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Exam Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-4 h-fit">
                    <h3 className="font-bold text-lg text-text-dark">Exam Details</h3>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            defaultValue={initialData?.title}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            placeholder="e.g. OSN 2024 Simulation"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Description</label>
                        <textarea
                            name="description"
                            defaultValue={initialData?.description}
                            rows={3}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            placeholder="Instructions for students..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Duration (Minutes)</label>
                            <input
                                type="number"
                                name="duration"
                                defaultValue={initialData?.duration || 60}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                                min={1}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Category</label>
                            <select
                                name="category"
                                defaultValue={initialData?.category}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            >
                                <option value="Latihan">Latihan</option>
                                <option value="Try Out">Try Out</option>
                                <option value="Simulasi">Simulasi</option>
                                <option value="OSN">OSN</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            defaultChecked={initialData ? initialData.isActive : true}
                            className="w-4 h-4 text-accent-earthy"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-text-dark">Is Active (Visible to Students)</label>
                    </div>
                </div>

                {/* Question Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 h-fit">
                    <QuestionSelector
                        selectedIds={selectedQuestionIds}
                        onSelectionChange={setSelectedQuestionIds}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {isLoading ? "Saving..." : "Save Exam"}
                </button>
            </div>
        </form>
    );
}
