import { getPublicStats } from "@/app/actions/site";
import { DEFAULT_PUBLIC_STATS } from "@/lib/nav-icons";
import StatCard from "@/components/public/StatCard";

export default async function StatistikPage() {
    const stats = await getPublicStats();
    const statItems = stats.length > 0 ? stats : DEFAULT_PUBLIC_STATS;

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-10 relative z-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-text-dark mb-2">Statistik OSN Kebumian</h1>
                    <p className="text-text-dark/60 max-w-2xl">
                        Data peserta, provinsi, dan rekap tahunan. Dikelola dari pengaturan situs.
                    </p>
                </header>
                <section className="mb-12" aria-label="Ringkasan statistik">
                    <h2 className="text-xl font-bold text-text-dark mb-6">Ringkasan</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statItems.map((s) => (
                            <StatCard key={s.key} value={s.value} label={s.label} />
                        ))}
                    </div>
                </section>
                <section className="rounded-xl border border-neutral-warm/15 bg-[#faf8f6] p-8 text-center">
                    <h2 className="text-lg font-bold text-text-dark mb-2">Grafik & Rekap Tahunan</h2>
                    <p className="text-text-dark/50 text-sm max-w-md mx-auto">
                        Chart dan tabel rekap akan ditampilkan di sini.
                    </p>
                    <div className="mt-6 h-48 rounded-lg border border-neutral-warm/20 bg-white/60 flex items-center justify-center text-text-dark/40 text-sm">
                        Area chart (akan dilengkapi)
                    </div>
                </section>
            </div>
        </div>
    );
}
