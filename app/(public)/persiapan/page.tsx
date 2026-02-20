import Link from "next/link";
import { getPageWithSections } from "@/app/actions/pages";

const FALLBACK_SECTIONS = [
    { sectionKey: "gambaran-umum", title: "Gambaran Umum", content: "<p>Olimpiade Sains Nasional (OSN) bidang Kebumian menguji pemahaman peserta dalam geosains: geografi fisik, meteorologi, klimatologi, dan geologi. Persiapan yang terstruktur dan mengikuti silabus resmi akan membantu peserta mengoptimalkan hasil.</p><p><strong>Tip:</strong> Manfaatkan materi dari portal ini dan arsip soal tahun sebelumnya untuk berlatih.</p>" },
    { sectionKey: "materi-dasar", title: "Materi Dasar", content: "<p>Materi dasar meliputi pemahaman tentang Bumi sebagai sistem: litosfer, hidrosfer, atmosfer, dan biosfer.</p>" },
    { sectionKey: "geografi-fisik", title: "Geografi Fisik", content: "<p>Geografi fisik mencakup bentang alam, proses geomorfologi, sungai, pantai, dan dinamika permukaan Bumi.</p>" },
    { sectionKey: "meteorologi", title: "Meteorologi", content: "<p>Meteorologi dan klimatologi meliputi sirkulasi atmosfer, cuaca, iklim, dan dampaknya.</p>" },
    { sectionKey: "geologi", title: "Geologi", content: "<p>Geologi mencakup batuan, mineral, struktur geologi, sejarah Bumi, dan sumber daya.</p>" },
    { sectionKey: "sumber-belajar", title: "Sumber Belajar", content: "<p>Sumber belajar resmi akan diunggah melalui portal ini. <a href=\"/login\">Login</a> ke akun peserta untuk mengakses materi lengkap.</p>" },
];

export default async function PersiapanPage() {
    const data = await getPageWithSections("persiapan");
    const title = data?.page.title ?? "Persiapan OSN Kebumian";
    const sections = (data?.sections && data.sections.length > 0) ? data.sections : FALLBACK_SECTIONS;

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
                    <aside className="lg:sticky lg:top-24 h-fit">
                        <nav className="rounded-xl border border-neutral-warm/20 bg-white p-3 shadow-sm" aria-label="Daftar isi">
                            <p className="text-xs font-semibold text-text-dark/60 uppercase tracking-wider px-2 py-1 mb-2">Daftar Isi</p>
                            <ul className="space-y-0.5">
                                {sections.map((s) => (
                                    <li key={s.sectionKey}>
                                        <a href={`#${s.sectionKey}`} className="block rounded-lg px-3 py-2 text-sm font-medium text-text-dark/80 hover:bg-neutral-warm/15 hover:text-accent-earthy transition-colors">
                                            {s.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                    <article className="max-w-[720px]">
                        <h1 className="text-3xl font-bold text-text-dark mb-6">{title}</h1>
                        <div className="h-px bg-neutral-warm/20 mb-8" />
                        {sections.map((s) => (
                            <section key={s.sectionKey} id={s.sectionKey} className="mb-10 scroll-mt-24">
                                <h2 className="text-xl font-bold text-text-dark mb-4">{s.title}</h2>
                                <div
                                    className="prose prose-neutral max-w-none text-text-dark/80 leading-relaxed news-content"
                                    dangerouslySetInnerHTML={{ __html: s.content ?? "" }}
                                />
                            </section>
                        ))}
                    </article>
                </div>
            </div>
        </div>
    );
}
