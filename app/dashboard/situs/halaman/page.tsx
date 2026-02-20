import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPagesForAdmin } from "@/app/actions/pages";

const DEFAULT_SLUGS = [
    { slug: "persiapan", title: "Persiapan", description: "Halaman persiapan OSN (sidebar + section)" },
    { slug: "silabus", title: "Silabus", description: "Halaman silabus (topik & item)" },
    { slug: "tentang", title: "Tentang OSN", description: "Halaman tentang (single content)" },
];

export default async function HalamanSitusPage() {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") redirect("/dashboard");

    const pages = await getPagesForAdmin();
    const slugSet = new Set(pages.map((p) => p.slug));
    const toShow = [...pages];
    for (const d of DEFAULT_SLUGS) {
        if (!slugSet.has(d.slug)) toShow.push({ id: 0, slug: d.slug, title: d.title, template: null });
    }

    return (
        <div className="space-y-6">
            <div>
                <Link href="/dashboard/situs" className="text-sm text-accent-earthy hover:underline">← Pengaturan Situs</Link>
                <h1 className="text-2xl font-bold text-text-dark mt-1">Halaman Publik</h1>
                <p className="text-text-dark/60 mt-1">Kelola konten halaman Persiapan, Silabus, dan Tentang.</p>
            </div>
            <div className="rounded-xl border border-neutral-warm/20 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead className="bg-neutral-light">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Judul</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Template</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {toShow.map((p) => (
                            <tr key={p.slug} className="border-t border-neutral-warm/20">
                                <td className="px-6 py-4 font-mono text-sm">{p.slug}</td>
                                <td className="px-6 py-4 font-medium">{p.title}</td>
                                <td className="px-6 py-4 text-sm text-text-dark/70">{p.template ?? "default"}</td>
                                <td className="px-6 py-4">
                                    <Link href={`/dashboard/situs/halaman/edit/${p.slug}`} className="text-accent-earthy text-sm hover:underline">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
