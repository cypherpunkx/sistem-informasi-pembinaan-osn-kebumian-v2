import Link from "next/link";
import {
    getArsipSoalPublic,
    getArsipSoalYears,
    getArsipSoalTahapOptions,
    getArsipSoalJenjangOptions,
} from "@/app/actions/soal-archives";

const DEFAULT_TAHAP = ["Nasional", "Provinsi", "Kabupaten/Kota"];
const DEFAULT_JENJANG = ["SMA", "SMP"];

function buildQuery(params: { tahun?: string; tahap?: string; jenjang?: string; page?: number }) {
    const q = new URLSearchParams();
    if (params.tahun) q.set("tahun", params.tahun);
    if (params.tahap) q.set("tahap", params.tahap);
    if (params.jenjang) q.set("jenjang", params.jenjang);
    if (params.page && params.page > 1) q.set("page", String(params.page));
    return q.toString();
}

export default async function ArsipSoalPage({
    searchParams,
}: {
    searchParams?: Promise<{ tahun?: string; tahap?: string; jenjang?: string; page?: string }>;
}) {
    const params = await searchParams ?? {};
    const tahunParam = params.tahun ?? "";
    const tahap = params.tahap ?? "";
    const jenjang = params.jenjang ?? "";
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const tahunNum = tahunParam ? parseInt(tahunParam, 10) : null;

    const [years, tahapOptions, jenjangOptions, { data, total, totalPages }] = await Promise.all([
        getArsipSoalYears(),
        getArsipSoalTahapOptions(),
        getArsipSoalJenjangOptions(),
        getArsipSoalPublic({
            page,
            limit: 12,
            tahun: tahunNum && !Number.isNaN(tahunNum) ? tahunNum : undefined,
            tahap: tahap || undefined,
            jenjang: jenjang || undefined,
        }),
    ]);

    const tahunOptions = years.length > 0 ? years : [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
    const tahapList = tahapOptions.length > 0 ? tahapOptions : DEFAULT_TAHAP;
    const jenjangList = jenjangOptions.length > 0 ? jenjangOptions : DEFAULT_JENJANG;

    const buildHref = (overrides: Record<string, string | number>) => {
        const t = String(overrides.tahun ?? tahunParam);
        const tp = String(overrides.tahap ?? tahap);
        const j = String(overrides.jenjang ?? jenjang);
        return `/arsip-soal?${buildQuery({ tahun: t || undefined, tahap: tp || undefined, jenjang: j || undefined })}`;
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-10 relative z-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-text-dark mb-2">Arsip Soal OSN Kebumian</h1>
                    <p className="text-text-dark/60 max-w-2xl">
                        Kumpulan soal OSN Kebumian tahun sebelumnya. Dikelola dari dashboard. Gunakan filter untuk mempersempit hasil.
                    </p>
                </header>

                <nav className="flex flex-wrap gap-2 mb-8" aria-label="Filter arsip">
                    <span className="text-sm text-text-dark/60 py-2 pr-1">Tahun:</span>
                    <Link
                        href="/arsip-soal"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!tahunParam ? "bg-accent-earthy text-white" : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"}`}
                    >
                        Semua
                    </Link>
                    {tahunOptions.map((t) => (
                        <Link
                            key={t}
                            href={buildHref({ tahun: String(t) })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tahunParam === String(t) ? "bg-accent-earthy text-white" : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"}`}
                        >
                            {t}
                        </Link>
                    ))}
                    <span className="w-px bg-neutral-warm/30 mx-1" aria-hidden />
                    <span className="text-sm text-text-dark/60 py-2 pr-1">Tahap:</span>
                    <Link
                        href={buildHref({ tahap: "" })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!tahap ? "bg-accent-earthy text-white" : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"}`}
                    >
                        Semua Tahap
                    </Link>
                    {tahapList.map((tp) => (
                        <Link
                            key={tp}
                            href={buildHref({ tahap: tp })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tahap === tp ? "bg-accent-earthy text-white" : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"}`}
                        >
                            {tp}
                        </Link>
                    ))}
                    <span className="w-px bg-neutral-warm/30 mx-1" aria-hidden />
                    <span className="text-sm text-text-dark/60 py-2 pr-1">Jenjang:</span>
                    <Link
                        href={buildHref({ jenjang: "" })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!jenjang ? "bg-accent-earthy text-white" : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"}`}
                    >
                        Semua Jenjang
                    </Link>
                    {jenjangList.map((j) => (
                        <Link
                            key={j}
                            href={buildHref({ jenjang: j })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${jenjang === j ? "bg-accent-earthy text-white" : "bg-neutral-warm/20 text-text-dark hover:bg-neutral-warm/30"}`}
                        >
                            {j}
                        </Link>
                    ))}
                </nav>

                <div className="space-y-4">
                    {data.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-neutral-warm/15 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-wrap items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-bold text-text-dark">Tahun {item.tahun}</p>
                                <p className="text-sm text-text-dark/60">{item.tahap} · {item.jenjang}</p>
                                {item.title && <p className="text-sm text-text-dark/70 mt-0.5">{item.title}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={item.soalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 rounded-lg border border-accent-earthy/30 text-accent-earthy text-sm font-medium hover:bg-accent-earthy/10 transition-colors"
                                >
                                    Unduh Soal
                                </a>
                                {item.pembahasanUrl && (
                                    <a
                                        href={item.pembahasanUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 rounded-lg bg-accent-earthy text-white text-sm font-medium hover:bg-text-dark transition-colors"
                                    >
                                        Pembahasan
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {page > 1 && (
                            <Link
                                href={`/arsip-soal?${buildQuery({ tahun: tahunParam, tahap, jenjang, page: page - 1 })}`}
                                className="px-4 py-2 rounded-lg border border-neutral-warm/20 text-sm font-medium text-text-dark hover:bg-neutral-light"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        <span className="px-4 py-2 text-sm text-text-dark/60">Halaman {page} dari {totalPages}</span>
                        {page < totalPages && (
                            <Link
                                href={`/arsip-soal?${buildQuery({ tahun: tahunParam, tahap, jenjang, page: page + 1 })}`}
                                className="px-4 py-2 rounded-lg border border-neutral-warm/20 text-sm font-medium text-text-dark hover:bg-neutral-light"
                            >
                                Selanjutnya
                            </Link>
                        )}
                    </div>
                )}

                {data.length === 0 && (
                    <p className="mt-8 text-text-dark/50 text-sm text-center">
                        Belum ada arsip soal. Arsip dikelola dari dashboard.
                    </p>
                )}
            </div>
        </div>
    );
}
