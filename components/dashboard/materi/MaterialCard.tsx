import { FileText, Video, MonitorPlay, FileType } from "lucide-react";
import Link from "next/link";

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

export default function MaterialCard({ material }: MaterialCardProps) {
    const Icon = typeIcons[material.type] || FileText;
    const colorClass = typeColors[material.type] || "bg-gray-100 text-gray-600";

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-neutral-light text-text-dark/60">
                        {material.topic}
                    </span>
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
            <div className="p-4 border-t border-neutral-warm/20 bg-neutral-light/20">
                <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full px-4 py-2 bg-white border border-neutral-warm/30 rounded-lg text-sm font-bold text-accent-earthy hover:bg-accent-earthy hover:text-white transition-colors"
                >
                    View Material
                </a>
            </div>
        </div>
    );
}
