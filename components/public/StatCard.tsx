type Props = {
    value: string;
    label: string;
};

export default function StatCard({ value, label }: Props) {
    return (
        <div className="rounded-xl border border-neutral-warm/15 bg-[#faf8f6] p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-accent-earthy tabular-nums">{value}</p>
            <p className="text-sm text-text-dark/60 mt-1">{label}</p>
        </div>
    );
}
