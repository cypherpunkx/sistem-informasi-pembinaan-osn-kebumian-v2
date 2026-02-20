import Link from "next/link";
import { getPageBySlug } from "@/app/actions/pages";
import { sanitizeHtml } from "@/lib/sanitize-html";

const FALLBACK_TITLE = "Tentang OSN Kebumian";
const FALLBACK_DESCRIPTION = "Informasi umum tentang Olimpiade Sains Nasional bidang Kebumian.";
const FALLBACK_HTML = "<h2>Apa itu OSN Kebumian?</h2><p>Olimpiade Sains Nasional (OSN) adalah ajang kompetisi sains tahunan bagi siswa Indonesia. Bidang Kebumian menguji pemahaman peserta dalam geosains: geografi fisik, meteorologi, klimatologi, dan geologi.</p><h2>Portal Pembinaan</h2><p>Portal ini merupakan sumber informasi dan persiapan resmi untuk OSN Kebumian.</p>";

export default async function TentangPage() {
    const page = await getPageBySlug("tentang");
    const title = page?.title ?? FALLBACK_TITLE;
    const description = page?.description ?? FALLBACK_DESCRIPTION;
    const rawContent = page?.content?.trim() || FALLBACK_HTML;
    const content = sanitizeHtml(rawContent);

    return (
        <div className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-10 relative z-10 max-w-3xl">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-text-dark mb-2">{title}</h1>
                    <p className="text-text-dark/60">{description}</p>
                </header>
                <div
                    className="prose prose-neutral max-w-none news-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
                <p className="mt-8">
                    <Link href="/" className="text-accent-earthy font-medium hover:underline text-sm">Kembali ke Beranda →</Link>
                </p>
            </div>
        </div>
    );
}
