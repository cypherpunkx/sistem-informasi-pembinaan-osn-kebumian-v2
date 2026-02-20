"use client";

import { useActionState } from "react";
import { setPublicStatFromForm } from "@/app/actions/site";
import { FormFeedback } from "./FormFeedback";

type State = { success: boolean; message: string } | null;

function statAction(_prev: State, formData: FormData): Promise<State> {
    return setPublicStatFromForm(formData);
}

type Props = {
    statKey: string;
    defaultValue: string;
    defaultLabel: string;
    sortOrder: number;
};

export default function StatFormRow({ statKey, defaultValue, defaultLabel, sortOrder }: Props) {
    const [state, formAction, isPending] = useActionState(statAction, null);

    return (
        <div className="flex flex-wrap gap-3 items-end">
            <form action={formAction} className="flex flex-wrap gap-3 items-end">
                <input type="hidden" name="key" value={statKey} />
                <input type="hidden" name="sortOrder" value={sortOrder} />
                <div>
                    <label className="block text-xs text-text-dark/60">Key</label>
                    <input type="text" value={statKey} readOnly className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-32 bg-neutral-warm/10" />
                </div>
                <div>
                    <label className="block text-xs text-text-dark/60">Value</label>
                    <input type="text" name="value" defaultValue={defaultValue} placeholder="38 atau 12.000+" disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-32 disabled:opacity-70" />
                </div>
                <div>
                    <label className="block text-xs text-text-dark/60">Label</label>
                    <input type="text" name="label" defaultValue={defaultLabel} disabled={isPending} className="rounded-lg border border-neutral-warm/40 px-3 py-2 w-44 disabled:opacity-70" />
                </div>
                <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-accent-earthy text-white text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                    {isPending ? "Menyimpan…" : "Simpan"}
                </button>
            </form>
            <FormFeedback state={state} />
        </div>
    );
}
