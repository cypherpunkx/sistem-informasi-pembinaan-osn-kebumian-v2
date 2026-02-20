"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteSoalArchiveFromForm } from "@/app/actions/soal-archives";

type State = { success: boolean; message: string } | null;

function deleteAction(_prev: State, formData: FormData): Promise<State> {
    return deleteSoalArchiveFromForm(formData);
}

export default function DeleteArsipSoalForm({ id }: { id: number }) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(deleteAction, null);

    if (state?.success) {
        router.refresh();
    }

    return (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <form action={formAction} className="inline">
                <input type="hidden" name="id" value={id} />
                <button type="submit" disabled={isPending} className="text-red-600 text-sm hover:underline disabled:opacity-70">
                    {isPending ? "Menghapus…" : "Hapus"}
                </button>
            </form>
            {state?.message && (
                <span className={`text-xs ${state.success ? "text-green-600" : "text-red-600"}`}>{state.message}</span>
            )}
        </span>
    );
}
