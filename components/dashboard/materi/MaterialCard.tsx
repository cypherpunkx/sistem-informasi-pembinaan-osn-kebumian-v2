"use client";

import { FileText, Video, MonitorPlay, FileType, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markMaterialComplete } from "@/app/actions/progress";

interface MaterialCardProps {
    material: {
        id: number;
        title: string;
        description: string | null;
        type: "PDF" | "VIDEO" | "SLIDE" | "TEXT";
        url: string;
        topic: string;
        tags: string[];
    };
    isCompleted?: boolean;
}

const typeIcons = {
    PDF: FileText,
    VIDEO: Video,
    SLIDE: MonitorPlay,
    TEXT: FileType,
};

const typeColors = {
    PDF: "bg-red-100 text-red-600",
    VIDEO: "bg-blue-100 text-blue-600",
    SLIDE: "bg-orange-100 text-orange-600",
    TEXT: "bg-green-100 text-green-600",
};

export default function MaterialCard({ material, isCompleted = false }: MaterialCardProps) {
    const router = useRouter();
    const [marking, setMarking] = useState(false);
    const [completed, setCompleted] = useState(isCompleted);

    const Icon = typeIcons[material.type] || FileText;
    const colorClass = typeColors[material.type] || "bg-gray-100 text-gray-600";

    async function handleMarkComplete() {
        setMarking(true);
        const result = await markMaterialComplete(material.id);
        setMarking(false);
        if (result?.success) {
            setCompleted(true);
            router.refresh();
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3 gap-2">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {completed && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Selesai
                            </span>
                        )}
                        <span className="text-xs font-bold px-2 py-1 rounded bg-neutral-light text-text-dark/60">
                            {material.topic}
                        </span>
                    </div>
                </div>
                <h3 className="font-bold text-text-dark text-lg mb-2 line-clamp-2" title={material.title}>
                    {material.title}
                </h3>
                <p className="text-text-dark/70 text-sm line-clamp-3 mb-4">
                    {material.description || "No description provided."}
                </p>
                <div className="flex flex-wrap gap-1">
                    {material.tags && material.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-neutral-warm/10 text-text-dark/60 rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="p-4 border-t border-neutral-warm/20 bg-neutral-light/20 space-y-2">
                {!completed && (
                    <button
                        type="button"
                        onClick={handleMarkComplete}
                        disabled={marking}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60 transition-colors"
                    >
                        {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Tandai selesai dibaca
                    </button>
                )}
                <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full px-4 py-2 bg-white border border-neutral-warm/30 rounded-lg text-sm font-bold text-accent-earthy hover:bg-accent-earthy hover:text-white transition-colors"
                >
                    {completed ? "Buka materi" : "View Material"}
                </a>
            </div>
        </div>
    );
}
