"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createSoalArchive } from "@/app/actions/soal-archives";
import { FormFeedback } from "./FormFeedback";

type State = { success: boolean; message: string } | null;

function createAction(_prev: State, formData: FormData): Promise<State> {
    return createSoalArchive(formData);
}

export default function ArsipSoalCreateForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(createAction, null);

    if (state?.success) {
        router.push("/dashboard/situs/arsip-soal");
    }

    return (
        <form action={formAction} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Tahun</label>
                <input type="number" name="tahun" required min={2000} max={2030} disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" placeholder="2025" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Tahap</label>
                <input type="text" name="tahap" required disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" placeholder="Nasional / Provinsi / Kabupaten/Kota" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Jenjang</label>
                <input type="text" name="jenjang" required disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" placeholder="SMA / SMP" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Judul (opsional)</label>
                <input type="text" name="title" disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" placeholder="Contoh: OSN Kebumian 2025" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">URL Soal *</label>
                <input type="url" name="soalUrl" required disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" placeholder="https://..." />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">URL Pembahasan (opsional)</label>
                <input type="url" name="pembahasanUrl" disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3">
                <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-accent-earthy text-white font-medium hover:bg-text-dark disabled:opacity-70 disabled:cursor-not-allowed">
                    {isPending ? "Menyimpan…" : "Simpan"}
                </button>
                <FormFeedback state={state} />
            </div>
        </form>
    );
}
