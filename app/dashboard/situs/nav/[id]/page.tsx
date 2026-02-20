import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { navCards } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { updateNavCardFromFormFormAction } from "@/app/actions/site";

const ICON_OPTIONS = ["BookOpen", "BookMarked", "Archive", "BarChart3", "Trophy", "Newspaper", "Circle"];

export default async function EditNavCardPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") redirect("/dashboard");
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) notFound();
    const [card] = await db.select().from(navCards).where(eq(navCards.id, idNum));
    if (!card) notFound();

    return (
        <div className="max-w-xl space-y-6">
            <Link href="/dashboard/situs" className="text-sm text-accent-earthy hover:underline">← Kembali ke Pengaturan Situs</Link>
            <h1 className="text-2xl font-bold text-text-dark">Edit Card Navigasi</h1>
            <form action={updateNavCardFromFormFormAction} className="space-y-4">
                <input type="hidden" name="id" value={card.id} />
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Judul</label>
                    <input type="text" name="title" defaultValue={card.title} required className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Deskripsi</label>
                    <input type="text" name="description" defaultValue={card.description ?? ""} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Link (href)</label>
                    <input type="text" name="href" defaultValue={card.href} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Icon</label>
                    <select name="icon" defaultValue={card.icon} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2">
                        {ICON_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Urutan</label>
                    <input type="number" name="sortOrder" defaultValue={card.sortOrder ?? 0} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2" />
                </div>
                <label className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked={card.isActive ?? true} value="on" />
                    <span className="text-sm text-text-dark">Aktif</span>
                </label>
                <button type="submit" className="px-4 py-2 rounded-lg bg-accent-earthy text-white font-medium">Simpan</button>
            </form>
        </div>
    );
}
