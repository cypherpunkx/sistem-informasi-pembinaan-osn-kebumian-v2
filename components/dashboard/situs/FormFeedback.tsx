"use client";

type Result = { success: boolean; message: string } | null;

type Props = {
    state: Result;
    className?: string;
};

export function FormFeedback({ state, className = "" }: Props) {
    if (!state?.message) return null;
    return (
        <p
            role="status"
            className={`text-sm py-2 px-3 rounded-lg ${state.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} ${className}`}
        >
            {state.message}
        </p>
    );
}
