"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/app/actions/nilai";
import { Loader2, Save, X } from "lucide-react";

interface FeedbackFormProps {
    sessionId: number;
    initialFeedback: string;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

export default function FeedbackForm({ sessionId, initialFeedback, onSubmitSuccess, onCancel }: FeedbackFormProps) {
    const [feedback, setFeedback] = useState(initialFeedback);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const maxLength = 1000;
    const remainingChars = maxLength - feedback.length;

    const handleSubmit = () => {
        if (feedback.trim().length === 0) {
            setError("Feedback cannot be empty");
            return;
        }

        if (feedback.length > maxLength) {
            setError(`Feedback must be ${maxLength} characters or less`);
            return;
        }

        setError(null);
        startTransition(async () => {
            const result = await submitFeedback(sessionId, feedback);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSubmitSuccess();
                }, 400);
            } else {
                setError(result.message || "Failed to save feedback");
            }
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write your feedback here... Provide constructive comments on the student's performance, areas for improvement, and encouragement."
                    className="w-full h-32 px-4 py-3 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy resize-none"
                    disabled={isPending || success}
                />
                <div className="flex items-center justify-between mt-2">
                    <span
                        className={`text-sm ${remainingChars < 0
                                ? "text-red-600 font-semibold"
                                : remainingChars < 100
                                    ? "text-yellow-600"
                                    : "text-text-dark/60"
                            }`}
                    >
                        {remainingChars} characters remaining
                    </span>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">✓ Feedback saved successfully!</p>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={isPending || success || remainingChars < 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Feedback
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isPending || success}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-warm/30 text-text-dark rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
            </div>
        </div>
    );
}
