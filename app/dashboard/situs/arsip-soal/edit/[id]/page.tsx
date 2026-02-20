import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { soalArchives } from "@/lib/schema";
import { eq } from "drizzle-orm";
import ArsipSoalEditForm from "@/components/dashboard/situs/ArsipSoalEditForm";

export default async function EditArsipSoalPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") redirect("/dashboard");
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) notFound();
    const [row] = await db.select().from(soalArchives).where(eq(soalArchives.id, idNum));
    if (!row) notFound();

    return (
        <div className="max-w-xl space-y-6">
            <Link href="/dashboard/situs/arsip-soal" className="text-sm text-accent-earthy hover:underline">← Kembali ke Arsip Soal</Link>
            <h1 className="text-2xl font-bold text-text-dark">Edit Arsip Soal</h1>
            <ArsipSoalEditForm
                id={row.id}
                defaultValue={{
                    tahun: row.tahun,
                    tahap: row.tahap,
                    jenjang: row.jenjang,
                    title: row.title,
                    soalUrl: row.soalUrl,
                    pembahasanUrl: row.pembahasanUrl,
                }}
            />
        </div>
    );
}
