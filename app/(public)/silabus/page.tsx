import Link from "next/link";
import { getPageWithSections } from "@/app/actions/pages";

const FALLBACK_TOPIK = [
    { sectionKey: "umum", title: "Gambaran Umum & Metode", content: "<ul class='space-y-2'><li>Sistem Bumi</li><li>Skala waktu geologi</li><li>Peta dan interpretasi</li></ul>" },
    { sectionKey: "geografi-fisik", title: "Geografi Fisik", content: "<ul class='space-y-2'><li>Geomorfologi</li><li>Hidrologi</li><li>Bentang alam</li><li>Proses fluvial dan pantai</li></ul>" },
    { sectionKey: "atmosfer", title: "Atmosfer, Cuaca & Iklim", content: "<ul class='space-y-2'><li>Sirkulasi atmosfer</li><li>Meteorologi</li><li>Klimatologi</li><li>Pemanasan global</li></ul>" },
    { sectionKey: "geologi", title: "Geologi", content: "<ul class='space-y-2'><li>Batuan dan mineral</li><li>Struktur geologi</li><li>Sejarah Bumi</li><li>Sumber daya geologi</li></ul>" },
];

export default async function SilabusPage() {
    const data = await getPageWithSections("silabus");
    const title = data?.page.title ?? "Silabus OSN Kebumian";
    const description = data?.page.description ?? "Ruang lingkup materi dan topik yang diujikan dalam OSN Kebumian. Gunakan sebagai peta belajar untuk persiapan.";
    const sections = (data?.sections && data.sections.length > 0) ? data.sections : FALLBACK_TOPIK;

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-10 relative z-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-text-dark mb-2">{title}</h1>
                    <p className="text-text-dark/60 max-w-2xl">{description}</p>
                </header>
                <div className="max-w-3xl space-y-8">
                    {sections.map((s) => (
                        <section key={s.sectionKey} id={s.sectionKey} className="rounded-xl border border-neutral-warm/15 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-text-dark mb-4">{s.title}</h2>
                            <div className="news-content text-text-dark/80" dangerouslySetInnerHTML={{ __html: s.content ?? "" }} />
                        </section>
                    ))}
                </div>
                <p className="mt-10 text-text-dark/60 text-sm">
                    <Link href="/persiapan" className="text-accent-earthy font-medium hover:underline">← Kembali ke Persiapan</Link>
                </p>
            </div>
        </div>
    );
}
