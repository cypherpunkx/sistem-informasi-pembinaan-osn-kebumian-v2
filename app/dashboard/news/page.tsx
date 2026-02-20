import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import StatusBadge from "@/components/dashboard/StatusBadge";
import NewsFilters from "@/components/dashboard/news/NewsFilters";
import {
    getNewsList,
    getNewsCounts,
    toggleNewsPublishFormAction,
} from "@/app/actions/news";
import Image from 'next/image';

const DEFAULT_PAGE_SIZE = 10;

export default async function NewsListPage({
    searchParams,
}: {
    searchParams?: Promise<{ search?: string; status?: string; page?: string }>;
}) {
    const session = await auth();
    const role = session?.user?.role as "admin" | "pembina" | "peserta" | undefined;
    if (role !== "admin" && role !== "pembina") {
        redirect("/dashboard");
    }

    const params = await searchParams;
    const pageNum = parseInt(params?.page ?? "1", 10);
    const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;

    const [counts, list] = await Promise.all([
        getNewsCounts(),
        getNewsList({
            search: params?.search,
            status: params?.status,
            page,
            limit: DEFAULT_PAGE_SIZE,
        }),
    ]);

    const { data: items, total, totalPages, limit } = list;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">News / Pengumuman</h1>
                    <p className="text-text-dark/60 mt-1">Kelola berita yang tampil di publik.</p>
                </div>
                <Link
                    href="/dashboard/news/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
                >
                    <Plus className="w-4 h-4" /> Buat Artikel
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-neutral-warm/20">
                    <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-bold text-text-dark">{counts.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-warm/20">
                    <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Published</p>
                    <p className="text-2xl font-bold text-text-dark">{counts.published}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-warm/20">
                    <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Draft</p>
                    <p className="text-2xl font-bold text-text-dark">{counts.draft}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-warm/20">
                    <p className="text-xs font-medium text-text-dark/60 uppercase tracking-wide">Views (30d)</p>
                    <p className="text-2xl font-bold text-text-dark">{counts.views30d}</p>
                </div>
            </div>

            <NewsFilters />

            <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-warm/20">
                        <thead className="bg-neutral-light">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                    Thumbnail
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                    Judul
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-warm/20">
                            {items.length > 0 ? (
                                items.map((row) => (
                                    <tr key={row.id} className="hover:bg-neutral-warm/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {row.thumbnailUrl ? (
                                                <Image
                                                    src={row.thumbnailUrl}
                                                    alt={row.title ?? 'Thumbnail'}
                                                    width={64}
                                                    height={64}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-neutral-warm/20 flex items-center justify-center text-text-dark/40 text-sm" aria-hidden>
                                                    —
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-text-dark max-w-md truncate" title={row.title}>
                                                {row.title}
                                            </div>
                                            <div className="text-xs text-text-dark/50">{row.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={row.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <form action={toggleNewsPublishFormAction}>
                                                    <input type="hidden" name="id" value={row.id} />
                                                    <button
                                                        type="submit"
                                                        className={
                                                            row.status === "PUBLISHED"
                                                                ? "text-red-600 hover:text-red-800 text-xs font-bold border border-red-200 px-2 py-1 rounded transition-colors"
                                                                : "text-green-600 hover:text-green-800 text-xs font-bold border border-green-200 px-2 py-1 rounded transition-colors"
                                                        }
                                                        title={row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                                    >
                                                        {row.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                                                    </button>
                                                </form>
                                                <Link
                                                    href={`/dashboard/news/edit/${row.id}`}
                                                    className="text-text-dark/60 hover:text-accent-earthy transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-text-dark/50 italic">
                                        Belum ada artikel. Buat artikel pertama untuk memulai.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-text-dark/60">
                        Halaman {page} dari {totalPages} ({total} artikel)
                    </p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link
                                href={`/dashboard/news?page=${page - 1}${params?.search ? `&search=${encodeURIComponent(params.search)}` : ""}${params?.status ? `&status=${params.status}` : ""}`}
                                className="px-3 py-2 rounded-lg border border-neutral-warm/20 text-sm hover:bg-neutral-light"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={`/dashboard/news?page=${page + 1}${params?.search ? `&search=${encodeURIComponent(params.search)}` : ""}${params?.status ? `&status=${params.status}` : ""}`}
                                className="px-3 py-2 rounded-lg border border-neutral-warm/20 text-sm hover:bg-neutral-light"
                            >
                                Selanjutnya
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
