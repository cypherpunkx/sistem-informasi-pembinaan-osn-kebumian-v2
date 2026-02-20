"use client";

import { useActionState } from "react";
import { createNavCard } from "@/app/actions/site";
import { FormFeedback } from "./FormFeedback";

const ICON_OPTIONS = ["BookOpen", "BookMarked", "Archive", "BarChart3", "Trophy", "Newspaper", "Circle"];

type State = { success: boolean; message: string; id?: number } | null;

function createAction(_prev: State, formData: FormData): Promise<State> {
    return createNavCard(formData);
}

export default function NavCardCreateForm() {
    const [state, formAction, isPending] = useActionState(createAction, null);

    return (
        <div className="mb-4">
            <form action={formAction} className="flex flex-wrap gap-3 items-end">
                <input type="text" name="title" placeholder="Judul" required disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-40 disabled:opacity-70" />
                <input type="text" name="description" placeholder="Deskripsi" disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-48 disabled:opacity-70" />
                <input type="text" name="href" placeholder="Link (contoh: /persiapan)" disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-40 disabled:opacity-70" />
                <select name="icon" disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-36 disabled:opacity-70">
                    {ICON_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <input type="number" name="sortOrder" defaultValue="0" disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-20 disabled:opacity-70" />
                <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked disabled={isPending} />
                    Aktif
                </label>
                <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-accent-earthy text-white text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed">
                    {isPending ? "Menambah…" : "Tambah"}
                </button>
            </form>
            <FormFeedback state={state} className="mt-2" />
        </div>
    );
}
