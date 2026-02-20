import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ArsipSoalCreateForm from "@/components/dashboard/situs/ArsipSoalCreateForm";

export default async function CreateArsipSoalPage() {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") redirect("/dashboard");

    return (
        <div className="max-w-xl space-y-6">
            <Link href="/dashboard/situs/arsip-soal" className="text-sm text-accent-earthy hover:underline">← Kembali ke Arsip Soal</Link>
            <h1 className="text-2xl font-bold text-text-dark">Tambah Arsip Soal</h1>
            <ArsipSoalCreateForm />
        </div>
    );
}
