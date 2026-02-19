"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Loader2 } from "lucide-react";
import { createTopicPracticeExam } from "@/app/actions/topic-practice";

interface TopicPracticeFormProps {
    topic: string;
    questionCount: number;
}

export default function TopicPracticeForm({ topic, questionCount }: TopicPracticeFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        setLoading(true);
        setError(null);

        const result = await createTopicPracticeExam(topic, Math.min(10, questionCount));

        if (result.success && result.examId) {
            router.push(`/dashboard/latihan-ujian/${result.examId}`);
        } else {
            setError(result.message || "Gagal memulai latihan.");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Membuat latihan...
                    </>
                ) : (
                    <>
                        <PlayCircle className="w-5 h-5" />
                        Mulai Latihan
                    </>
                )}
            </button>

            {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
            )}
        </div>
    );
}
