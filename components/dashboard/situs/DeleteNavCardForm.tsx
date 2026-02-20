"use client";

import { useActionState } from "react";
import { deleteNavCardFromForm } from "@/app/actions/site";

type State = { success: boolean; message: string } | null;

function deleteAction(_prev: State, formData: FormData): Promise<State> {
    return deleteNavCardFromForm(formData);
}

export default function DeleteNavCardForm({ id }: { id: number }) {
    const [state, formAction, isPending] = useActionState(deleteAction, null);

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
