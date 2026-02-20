import Link from "next/link";
import { getNewsPublic, getNewsYears, type NewsCategoryFilter } from "@/app/actions/news";
import { getNewsCategoryLabel, NEWS_CATEGORIES } from "@/lib/news-categories";
import NewsYearSelect from "@/components/public/NewsYearSelect";
import { Newspaper } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const GRID_SIZE_FIRST_PAGE = 6;

function buildQuery(params: { category?: string; year?: string; page?: number }) {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.year) q.set("year", params.year);
    if (params.page && params.page > 1) q.set("page", String(params.page));
    return q.toString();
}

export default async function PublicNewsListPage({
    searchParams,
}: {
    searchParams?: Promise<{ page?: string; category?: string; year?: string }>;
}) {
    const params = await searchParams;
    const pageNum = parseInt(params?.page ?? "1", 10);
    const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const category = (params?.category?.trim() || "") as NewsCategoryFilter;
    const yearParam = params?.year?.trim();
    const year = yearParam ? parseInt(yearParam, 10) : null;
    const hasYearFilter = year !== null && !Number.isNaN(year) && year > 0;

    const isFirstPageNoFilter = page === 1 && !category && !hasYearFilter;
    const limit = isFirstPageNoFilter ? 1 + GRID_SIZE_FIRST_PAGE : DEFAULT_LIMIT;

    const [years, { data, total, totalPages }] = await Promise.all([
        getNewsYears(),
        getNewsPublic({
            page,
            limit,
            category: category || undefined,
            year: hasYearFilter && year !== null ? year : undefined,
        }),
    ]);

    const featured = isFirstPageNoFilter ? data[0] : null;
    const gridItems = isFirstPageNoFilter ? data.slice(1) : data;
    const hasFilters = !!category || hasYearFilter;

    return (
        <div className="bg-white min-h-screen relative">
            {/* Very subtle background pattern - formal */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.018]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='0.5' fill='%23493628'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="container mx-auto px-4 py-10 relative z-10">
                {/* Hero */}
                <header className="text-center mb-8">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent-earthy/15 text-accent-earthy border border-accent-earthy/30 mb-4">
                        Resmi
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold text-text-dark">
                        News & Pengumuman OSN Kebumian
                    </h1>
                    <p className="text-text-dark/60 mt-2 max-w-xl mx-auto">
                        Informasi terbaru seputar Olimpiade Sains Nasional bidang Kebumian.
                    </p>
                </header>

                {/* 1. Featured Article - di atas filter */}
                {featured && (
                    <section className="mb-10" aria-label="Artikel unggulan">
                        <Link
                            href={`/news/${featured.slug}`}
                            className="block rounded-2xl overflow-hidden border border-neutral-warm/15 shadow-sm hover:shadow-md transition-shadow bg-white"
                        >
                            <div className="aspect-video w-full max-w-4xl mx-auto bg-neutral-warm/5">
                                {featured.thumbnailUrl ? (
                                    <img
                                        src={featured.thumbnailUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-dark/25 text-3xl font-bold">
                                        Berita Utama
                                    </div>
                                )}
                            </div>
                            <div className="p-6 md:p-8">
                                <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-accent-earthy/15 text-accent-earthy mb-2">
                                    {getNewsCategoryLabel(featured.category)}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-text-dark mb-2">{featured.title}</h2>
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
                                    <p className="text-text-dark/70 line-clamp-3 mb-4">{featured.summary}</p>
                                )}
                                <span className="text-accent-earthy font-medium">Baca selengkapnya →</span>
                            </div>
                        </Link>
                    </section>
                )}

                {/* Filter Bar + Arsip Tahun */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <nav className="flex flex-wrap gap-2" aria-label="Filter kategori">
                        <Link
                            href={hasYearFilter ? `/news?year=${year!}` : "/news"}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                !category
                                    ? "bg-accent-earthy text-white"
                                    : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"
                            }`}
                        >
                            Semua
                        </Link>
                        {NEWS_CATEGORIES.map(({ value, label }) => {
                            const href = hasYearFilter ? `/news?category=${value}&year=${year!}` : `/news?category=${value}`;
                            return (
                                <Link
                                    key={value}
                                    href={href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        category === value
                                            ? "bg-accent-earthy text-white"
                                            : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                    {/* Arsip Tahun */}
                    <NewsYearSelect
                        years={years}
                        currentYear={hasYearFilter ? year : null}
                        category={category}
                    />
                </div>

                {/* 2. Grid Artikel - 3 kolom desktop */}
                <section aria-label="Daftar artikel">
                    <h2 className="sr-only">Artikel terbaru</h2>
                    {gridItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {gridItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/news/${item.slug}`}
                                    className="block rounded-xl border border-neutral-warm/15 overflow-hidden hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="aspect-video bg-neutral-warm/5 shrink-0">
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-dark/25 font-bold text-sm">
                                                Artikel
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-neutral-warm/20 text-text-dark/80 mb-2">
                                            {getNewsCategoryLabel(item.category)}
                                        </span>
                                        <h3 className="font-bold text-text-dark line-clamp-2">{item.title}</h3>
                                        <p className="text-xs text-text-dark/50 mt-1">
                                            {item.publishedAt
                                                ? new Date(item.publishedAt).toLocaleDateString("id-ID")
                                                : ""}
                                        </p>
                                        {item.summary && (
                                            <p className="text-sm text-text-dark/60 mt-2 line-clamp-2">{item.summary}</p>
                                        )}
                                        <span className="inline-block mt-2 text-accent-earthy text-sm font-medium">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* 4. Empty state elegan */
                        <div className="rounded-2xl border border-neutral-warm/20 bg-neutral-warm/5 py-16 px-6 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-warm/20 text-text-dark/40 mb-4">
                                <Newspaper className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-dark mb-2">Belum ada artikel</h3>
                            <p className="text-text-dark/60 max-w-sm mx-auto mb-6">
                                {hasFilters
                                    ? "Tidak ada artikel yang sesuai dengan filter yang dipilih. Coba ubah kategori atau tahun arsip."
                                    : "Belum ada pengumuman atau berita yang dipublikasi. Silakan cek lagi nanti."}
                            </p>
                            {hasFilters ? (
                                <Link
                                    href="/news"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-earthy text-white text-sm font-medium hover:bg-text-dark transition-colors"
                                >
                                    Tampilkan semua artikel
                                </Link>
                            ) : (
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-warm/30 text-text-dark text-sm font-medium hover:bg-neutral-warm/10 transition-colors"
                                >
                                    Kembali ke beranda
                                </Link>
                            )}
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
                        {page > 1 && (
                            <Link
                                href={`/news?${buildQuery({
                                    category: category || undefined,
                                    year: yearParam || undefined,
                                    page: page - 1,
                                })}`}
                                className="px-4 py-2 rounded-lg border border-neutral-warm/20 text-sm font-medium text-text-dark hover:bg-neutral-light"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        <span className="px-4 py-2 text-sm text-text-dark/60">
                            Halaman {page} dari {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link
                                href={`/news?${buildQuery({
                                    category: category || undefined,
                                    year: yearParam || undefined,
                                    page: page + 1,
                                })}`}
                                className="px-4 py-2 rounded-lg border border-neutral-warm/20 text-sm font-medium text-text-dark hover:bg-neutral-light"
                            >
                                Selanjutnya
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
