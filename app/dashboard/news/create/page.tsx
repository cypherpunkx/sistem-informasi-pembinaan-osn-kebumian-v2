import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import NewsForm from "@/components/dashboard/news/NewsForm";

export default async function CreateNewsPage() {
    const session = await auth();
    const role = session?.user?.role as "admin" | "pembina" | "peserta" | undefined;
    if (role !== "admin" && role !== "pembina") {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/news" className="text-sm text-accent-earthy hover:underline">
                        ← Kembali ke News
                    </Link>
                    <h1 className="text-2xl font-bold text-text-dark mt-1">Buat Artikel</h1>
                    <p className="text-text-dark/60 mt-1">Tambah artikel atau pengumuman baru.</p>
                </div>
            </div>
            <NewsForm mode="create" />
        </div>
    );
}
