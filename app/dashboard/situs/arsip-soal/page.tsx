import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getArsipSoalForAdmin } from "@/app/actions/soal-archives";
import DeleteArsipSoalForm from "@/components/dashboard/situs/DeleteArsipSoalForm";

export default async function ArsipSoalDashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ page?: string }>;
}) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "pembina") redirect("/dashboard");
    const params = await searchParams ?? {};
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const { data, total, totalPages } = await getArsipSoalForAdmin({ page, limit: 10 });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link href="/dashboard/situs" className="text-sm text-accent-earthy hover:underline">← Pengaturan Situs</Link>
                    <h1 className="text-2xl font-bold text-text-dark mt-1">Arsip Soal</h1>
                    <p className="text-text-dark/60 mt-1">Kelola link soal dan pembahasan per tahun/tahap/jenjang.</p>
                </div>
                <Link
                    href="/dashboard/situs/arsip-soal/create"
                    className="flex items-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark"
                >
                    <Plus className="w-4 h-4" /> Tambah Arsip
                </Link>
            </div>
            <div className="rounded-xl border border-neutral-warm/20 bg-white overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead className="bg-neutral-light">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Tahun</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Tahap</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Jenjang</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Judul</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row.id} className="border-t border-neutral-warm/20">
                                <td className="px-6 py-4 font-medium">{row.tahun}</td>
                                <td className="px-6 py-4">{row.tahap}</td>
                                <td className="px-6 py-4">{row.jenjang}</td>
                                <td className="px-6 py-4 text-sm text-text-dark/70">{row.title ?? "—"}</td>
                                <td className="px-6 py-4">
                                    <Link href={`/dashboard/situs/arsip-soal/edit/${row.id}`} className="text-accent-earthy text-sm hover:underline mr-2">Edit</Link>
                                    <DeleteArsipSoalForm id={row.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && (
                <p className="text-center text-text-dark/50 py-8">Belum ada arsip. Tambah dari tombol di atas.</p>
            )}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {page > 1 && (
                        <Link href={`/dashboard/situs/arsip-soal?page=${page - 1}`} className="px-4 py-2 rounded-lg border border-neutral-warm/20 text-sm">Sebelumnya</Link>
                    )}
                    <span className="px-4 py-2 text-sm text-text-dark/60">Halaman {page} dari {totalPages}</span>
                    {page < totalPages && (
                        <Link href={`/dashboard/situs/arsip-soal?page=${page + 1}`} className="px-4 py-2 rounded-lg border border-neutral-warm/20 text-sm">Selanjutnya</Link>
                    )}
                </div>
            )}
        </div>
    );
}
