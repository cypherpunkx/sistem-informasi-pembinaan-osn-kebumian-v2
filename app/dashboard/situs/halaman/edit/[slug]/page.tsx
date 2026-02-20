import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPageWithSections, getPageBySlug, savePageFormAction } from "@/app/actions/pages";

export default async function EditHalamanPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") redirect("/dashboard");
    const { slug } = await params;
    const allowed = ["persiapan", "silabus", "tentang"];
    if (!allowed.includes(slug)) notFound();

    const withSections = await getPageWithSections(slug);
    const single = await getPageBySlug(slug);
    const isSingle = slug === "tentang" || (single && !withSections?.sections?.length);
    const title = withSections?.page?.title ?? single?.title ?? slug;
    const description = withSections?.page?.description ?? single?.description ?? "";
    const content = single?.content ?? "";

    return (
        <div className="max-w-3xl space-y-6">
            <Link href="/dashboard/situs/halaman" className="text-sm text-accent-earthy hover:underline">← Kembali ke Halaman</Link>
            <h1 className="text-2xl font-bold text-text-dark">Edit: {slug}</h1>
            <form action={savePageFormAction} className="space-y-4">
                <input type="hidden" name="slug" value={slug} />
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Judul</label>
                    <input type="text" name="title" defaultValue={title} required className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Deskripsi (meta)</label>
                    <input type="text" name="description" defaultValue={description} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2" />
                </div>
                <input type="hidden" name="template" value={slug === "tentang" ? "default" : slug} />
                {isSingle && (
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Konten (HTML)</label>
                        <textarea name="content" defaultValue={content} rows={14} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 font-mono text-sm" placeholder="<p>...</p>" />
                    </div>
                )}
                <button type="submit" className="px-4 py-2 rounded-lg bg-accent-earthy text-white font-medium">Simpan</button>
            </form>
            {!isSingle && withSections?.sections && withSections.sections.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-text-dark mb-2">Section</h2>
                    <p className="text-sm text-text-dark/60 mb-2">Edit section via database atau tambah action edit section di sini.</p>
                    <ul className="list-disc list-inside text-sm text-text-dark/70">
                        {withSections.sections.map((s) => (
                            <li key={s.id}>{s.sectionKey}: {s.title}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
