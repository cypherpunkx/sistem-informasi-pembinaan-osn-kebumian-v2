import Link from "next/link";
import { getNewsPublic } from "@/app/actions/news";
import { getHomepageHero, getNavCardsPublic, getPublicStats } from "@/app/actions/site";
import { getNewsCategoryLabel } from "@/lib/news-categories";
import { DEFAULT_NAV_CARDS, DEFAULT_PUBLIC_STATS } from "@/lib/nav-icons";
import NavCard from "@/components/public/NavCard";
import StatCard from "@/components/public/StatCard";

export default async function BerandaPage() {
    const [hero, navCards, stats, { data: latestNews }] = await Promise.all([
        getHomepageHero(),
        getNavCardsPublic(),
        getPublicStats(),
        getNewsPublic({ page: 1, limit: 4 }),
    ]);
    const featured = latestNews[0] ?? null;
    const listNews = latestNews.slice(1, 4);
    const cards = navCards.length > 0 ? navCards : DEFAULT_NAV_CARDS.map((c) => ({ id: 0, ...c, description: c.description }));
    const statItems = stats.length > 0 ? stats : DEFAULT_PUBLIC_STATS;

    return (
        <div className="bg-white min-h-screen relative">
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.018]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='0.5' fill='%23493628'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
                {/* 1. Hero - dari sistem */}
                <header className="text-center mb-14">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent-earthy/15 text-accent-earthy border border-accent-earthy/30 mb-4">
                        {hero.badge}
                    </span>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-dark max-w-3xl mx-auto">
                        {hero.title}
                    </h1>
                    <p className="text-text-dark/60 mt-4 max-w-xl mx-auto text-lg">
                        {hero.description}
                    </p>
                    <Link
                        href={hero.ctaUrl}
                        className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-accent-earthy text-white font-semibold shadow-sm hover:bg-text-dark hover:shadow-md transition-all"
                    >
                        {hero.ctaText}
                    </Link>
                </header>

                {/* 2. Navigasi Utama - dari sistem atau default */}
                <section className="mb-16" aria-label="Navigasi utama">
                    <h2 className="text-xl font-bold text-text-dark mb-6">Navigasi Utama OSN Kebumian</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cards.map((c) => (
                            <NavCard
                                key={c.href + (c.id ?? 0)}
                                href={c.href}
                                icon={"icon" in c ? c.icon : "Circle"}
                                title={c.title}
                                description={c.description ?? ""}
                            />
                        ))}
                    </div>
                </section>

                {/* 3. Highlight Pengumuman Terbaru - 1 featured + 3 list */}
                <section className="mb-16" aria-label="Highlight pengumuman">
                    <h2 className="text-xl font-bold text-text-dark mb-6">Highlight Pengumuman Terbaru</h2>
                    {featured ? (
                        <>
                            <Link
                                href={`/news/${featured.slug}`}
                                className="block rounded-2xl overflow-hidden border border-neutral-warm/15 shadow-sm hover:shadow-md transition-shadow bg-white mb-6"
                            >
                                <div className="aspect-video w-full max-w-4xl mx-auto bg-neutral-warm/5">
                                    {featured.thumbnailUrl ? (
                                        <img src={featured.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-dark/25 text-2xl font-bold">
                                            Berita Utama
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 md:p-8">
                                    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-accent-earthy/15 text-accent-earthy mb-2">
                                        {getNewsCategoryLabel(featured.category)}
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-2">{featured.title}</h3>
                                    <p className="text-sm text-text-dark/50 mb-3">
                                        {featured.publishedAt
                                            ? new Date(featured.publishedAt).toLocaleDateString("id-ID", {
                                                  day: "numeric",
                                                  month: "long",
                                                  year: "numeric",
                                              })
                                            : ""}
                                    </p>
                                    {featured.summary && (
                                        <p className="text-text-dark/70 line-clamp-2 mb-4">{featured.summary}</p>
                                    )}
                                    <span className="text-accent-earthy font-medium">Baca selengkapnya →</span>
                                </div>
                            </Link>
                            {listNews.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {listNews.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/news/${item.slug}`}
                                            className="flex gap-4 rounded-xl border border-neutral-warm/15 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="w-20 h-20 shrink-0 rounded-lg bg-neutral-warm/10 overflow-hidden">
                                                {item.thumbnailUrl ? (
                                                    <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-dark/30 text-xs">Art</div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-neutral-warm/20 text-text-dark/80 mb-1">
                                                    {getNewsCategoryLabel(item.category)}
                                                </span>
                                                <h4 className="font-bold text-text-dark text-sm line-clamp-2">{item.title}</h4>
                                                <p className="text-xs text-text-dark/50 mt-0.5">
                                                    {item.publishedAt
                                                        ? new Date(item.publishedAt).toLocaleDateString("id-ID")
                                                        : ""}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <p className="mt-4 text-center">
                                <Link href="/news" className="text-sm font-medium text-accent-earthy hover:underline">
                                    Lihat semua pengumuman →
                                </Link>
                            </p>
                        </>
                    ) : (
                        <div className="rounded-xl border border-neutral-warm/20 bg-neutral-warm/5 py-10 px-6 text-center">
                            <p className="text-text-dark/60 mb-4">Belum ada pengumuman.</p>
                            <Link href="/news" className="text-sm font-medium text-accent-earthy hover:underline">
                                Ke News & Pengumuman →
                            </Link>
                        </div>
                    )}
                </section>

                {/* 4. Statistik - dari sistem atau default */}
                <section className="mb-8" aria-label="Statistik">
                    <h2 className="text-xl font-bold text-text-dark mb-6">Statistik</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statItems.map((s) => (
                            <StatCard key={s.key} value={s.value} label={s.label} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
