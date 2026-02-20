import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
    getSiteSettingsForAdmin,
    getNavCardsForAdmin,
    getPublicStatsForAdmin,
} from "@/app/actions/site";
import { getNavIcon } from "@/lib/nav-icons";
import HeroForm from "@/components/dashboard/situs/HeroForm";
import NavCardCreateForm from "@/components/dashboard/situs/NavCardCreateForm";
import DeleteNavCardForm from "@/components/dashboard/situs/DeleteNavCardForm";
import StatFormRow from "@/components/dashboard/situs/StatFormRow";

export default async function SitusPage() {
    const session = await auth();
    const role = session?.user?.role as string | undefined;
    if (role !== "admin" && role !== "pembina") redirect("/dashboard");

    const [settings, navCards, stats] = await Promise.all([
        getSiteSettingsForAdmin(),
        getNavCardsForAdmin(),
        getPublicStatsForAdmin(),
    ]);

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-text-dark">Pengaturan Situs Publik</h1>
                <p className="text-text-dark/60 mt-1">Kelola hero beranda, navigasi, dan statistik. Halaman & arsip soal di bawah.</p>
            </div>

            {/* Hero */}
            <section className="rounded-xl border border-neutral-warm/20 bg-white p-6">
                <h2 className="text-lg font-bold text-text-dark mb-4">Hero Beranda</h2>
                <HeroForm defaultValues={settings} />
            </section>

            {/* Nav Cards */}
            <section className="rounded-xl border border-neutral-warm/20 bg-white p-6">
                <h2 className="text-lg font-bold text-text-dark mb-4">Navigasi Utama (Card)</h2>
                <NavCardCreateForm />
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-neutral-warm/20 rounded-lg overflow-hidden">
                        <thead className="bg-neutral-light">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-text-dark">Icon</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-text-dark">Judul</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-text-dark">Link</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-text-dark">Urutan</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-text-dark">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {navCards.map((c) => {
                                const Icon = getNavIcon(c.icon);
                                return (
                                    <tr key={c.id} className="border-t border-neutral-warm/20">
                                        <td className="px-4 py-2"><Icon className="h-5 w-5 text-accent-earthy" /></td>
                                        <td className="px-4 py-2 font-medium">{c.title}</td>
                                        <td className="px-4 py-2 text-sm text-text-dark/70">{c.href}</td>
                                        <td className="px-4 py-2">{c.sortOrder ?? 0}</td>
                                        <td className="px-4 py-2">
                                            <Link href={`/dashboard/situs/nav/${c.id}`} className="text-accent-earthy text-sm hover:underline mr-2">Edit</Link>
                                            <DeleteNavCardForm id={c.id} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Statistik */}
            <section className="rounded-xl border border-neutral-warm/20 bg-white p-6">
                <h2 className="text-lg font-bold text-text-dark mb-4">Statistik Publik</h2>
                <p className="text-sm text-text-dark/60 mb-4">Angka yang tampil di beranda & halaman Statistik. Ubah value dan label lalu simpan.</p>
                <div className="space-y-4 max-w-xl">
                    {(stats.length > 0 ? stats : [{ key: "provinsi", value: "38", label: "Provinsi" }, { key: "peserta", value: "12.000+", label: "Peserta" }, { key: "tahun", value: "20+", label: "Tahun Penyelenggaraan" }, { key: "arsip", value: "500+", label: "Arsip Soal" }]).map((s, i) => (
                        <StatFormRow key={s.key} statKey={s.key} defaultValue={s.value} defaultLabel={s.label} sortOrder={i} />
                    ))}
                </div>
                <p className="text-xs text-text-dark/50 mt-2">Untuk menambah stat baru, gunakan key unik (mis. provinsi, peserta) dan isi value + label.</p>
            </section>

            {/* Links to Halaman & Arsip */}
            <section className="rounded-xl border border-neutral-warm/20 bg-white p-6">
                <h2 className="text-lg font-bold text-text-dark mb-4">Halaman & Arsip</h2>
                <div className="flex flex-wrap gap-4">
                    <Link href="/dashboard/situs/halaman" className="px-4 py-2 rounded-lg border border-accent-earthy/30 text-accent-earthy font-medium hover:bg-accent-earthy/10">
                        Kelola Halaman (Persiapan, Silabus, Tentang)
                    </Link>
                    <Link href="/dashboard/situs/arsip-soal" className="px-4 py-2 rounded-lg bg-accent-earthy text-white font-medium hover:bg-text-dark">
                        Kelola Arsip Soal
                    </Link>
                </div>
            </section>
        </div>
    );
}
