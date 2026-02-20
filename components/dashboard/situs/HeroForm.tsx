"use client";

import { useActionState } from "react";
import { setHomepageHero } from "@/app/actions/site";
import { FormFeedback } from "./FormFeedback";

const HERO_KEYS = ["hero_badge", "hero_title", "hero_description", "hero_cta_text", "hero_cta_url"] as const;
const HERO_LABELS: Record<string, string> = {
    hero_badge: "Badge (contoh: Resmi)",
    hero_title: "Judul Hero",
    hero_description: "Deskripsi",
    hero_cta_text: "Teks tombol CTA",
    hero_cta_url: "URL tombol (contoh: /persiapan)",
};

type State = { success: boolean; message: string } | null;

function heroAction(_prev: State, formData: FormData): Promise<State> {
    return setHomepageHero(formData);
}

export default function HeroForm({
    defaultValues,
}: {
    defaultValues: Record<string, string>;
}) {
    const [state, formAction, isPending] = useActionState(heroAction, null);

    return (
        <form action={formAction} className="space-y-4 max-w-xl">
            {HERO_KEYS.map((key) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-text-dark mb-1">{HERO_LABELS[key]}</label>
                    <input
                        type="text"
                        name={key}
                        defaultValue={defaultValues[key] ?? ""}
                        disabled={isPending}
                        className="w-full rounded-lg border border-neutral-warm/40 px-4 py-2 text-text-dark disabled:opacity-70"
                    />
                </div>
            ))}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-accent-earthy text-white font-medium hover:bg-text-dark disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? "Menyimpan…" : "Simpan Hero"}
                </button>
                <FormFeedback state={state} />
            </div>
        </form>
    );
}
