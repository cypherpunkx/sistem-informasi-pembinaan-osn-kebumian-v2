"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateSoalArchiveFromForm } from "@/app/actions/soal-archives";
import { FormFeedback } from "./FormFeedback";

type State = { success: boolean; message: string } | null;

function updateAction(_prev: State, formData: FormData): Promise<State> {
    return updateSoalArchiveFromForm(formData);
}

type Props = {
    id: number;
    defaultValue: { tahun: number; tahap: string; jenjang: string; title: string | null; soalUrl: string; pembahasanUrl: string | null };
};

export default function ArsipSoalEditForm({ id, defaultValue }: Props) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(updateAction, null);

    if (state?.success) {
        router.refresh();
    }

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Tahun</label>
                <input type="number" name="tahun" defaultValue={defaultValue.tahun} required min={2000} max={2030} disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Tahap</label>
                <input type="text" name="tahap" defaultValue={defaultValue.tahap} required disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Jenjang</label>
                <input type="text" name="jenjang" defaultValue={defaultValue.jenjang} required disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Judul (opsional)</label>
                <input type="text" name="title" defaultValue={defaultValue.title ?? ""} disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">URL Soal *</label>
                <input type="url" name="soalUrl" defaultValue={defaultValue.soalUrl} required disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-dark mb-1">URL Pembahasan (opsional)</label>
                <input type="url" name="pembahasanUrl" defaultValue={defaultValue.pembahasanUrl ?? ""} disabled={isPending} className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 disabled:opacity-70" />
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
