import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { getNavIcon } from "@/lib/nav-icons";

type Props = {
    href: string;
    icon: LucideIcon | string;
    title: string;
    description: string;
};

export default function NavCard({ href, icon, title, description }: Props) {
    const Icon = typeof icon === "string" ? getNavIcon(icon) : icon;
    return (
        <Link
            href={href}
            className="group block rounded-xl border border-accent-earthy/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="mb-3 inline-flex items-center justify-center rounded-lg border border-accent-earthy/20 bg-accent-earthy/5 p-3 text-accent-earthy">
                <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-text-dark mb-1 group-hover:text-accent-earthy transition-colors">{title}</h3>
            <p className="text-sm text-text-dark/60 leading-relaxed">{description}</p>
        </Link>
    );
}
