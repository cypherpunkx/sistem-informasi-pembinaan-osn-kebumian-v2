"use server";

import { cookies } from "next/headers";

const ACTIVE_EXAM_COOKIE = "active_exam_id";

export async function setActiveExamCookie(examId: number) {
    const c = await cookies();
    c.set(ACTIVE_EXAM_COOKIE, String(examId), {
        path: "/",
        maxAge: 60 * 60 * 4,
        sameSite: "lax",
    });
}

export async function clearActiveExamCookie() {
    const c = await cookies();
    c.delete(ACTIVE_EXAM_COOKIE);
}
