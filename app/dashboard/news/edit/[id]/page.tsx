import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getNewsById } from "@/app/actions/news";
import NewsForm from "@/components/dashboard/news/NewsForm";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const role = session?.user?.role as "admin" | "pembina" | "peserta" | undefined;
    if (role !== "admin" && role !== "pembina") {
        redirect("/dashboard");
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id) || id < 1) notFound();

    const row = await getNewsById(id);
    if (!row) notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/news" className="text-sm text-accent-earthy hover:underline">
                        ← Kembali ke News
                    </Link>
                    <h1 className="text-2xl font-bold text-text-dark mt-1">Edit Artikel</h1>
                    <p className="text-text-dark/60 mt-1">Perbarui detail artikel.</p>
                </div>
            </div>
            <NewsForm
                mode="edit"
                id={row.id}
                initial={{
                    title: row.title,
                    slug: row.slug,
                    category: row.category,
                    thumbnailUrl: row.thumbnailUrl,
                    summary: row.summary,
                    content: row.content,
                    status: row.status,
                    seoTitle: row.seoTitle,
                    seoDescription: row.seoDescription,
                }}
            />
        </div>
    );
}
