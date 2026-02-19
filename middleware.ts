import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const auth = NextAuth(authConfig).auth;

export default auth((req) => {
    const path = req.nextUrl.pathname;
    const activeExamId = req.cookies.get("active_exam_id")?.value;
    const role = req.auth?.user?.role;

    if (activeExamId && role === "peserta") {
        const onExamPage = /^\/dashboard\/latihan-ujian\/\d+$/.test(path);
        const onResultPage = /^\/dashboard\/latihan-ujian\/result\/\d+$/.test(path);

        if (onExamPage || onResultPage) {
            return NextResponse.next();
        }
        if (path.startsWith("/dashboard")) {
            return NextResponse.redirect(new URL(`/dashboard/latihan-ujian/${activeExamId}`, req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
