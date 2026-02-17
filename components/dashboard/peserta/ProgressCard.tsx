import { LucideIcon } from "lucide-react";

interface ProgressCardProps {
    title: string;
    value: string | number;
    label: string;
    icon: LucideIcon;
    colorClass: string; // e.g., "bg-blue-100 text-blue-600"
}

export default function ProgressCard({ title, value, label, icon: Icon, colorClass }: ProgressCardProps) {
    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
            <div className={`p-3 rounded-full ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-text-dark/60">{title}</p>
                <p className="text-2xl font-bold text-text-dark">{value}</p>
                <p className="text-xs text-text-dark/50">{label}</p>
            </div>
        </div>
    );
}
