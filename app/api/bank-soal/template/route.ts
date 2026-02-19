import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildTemplateRows } from "@/lib/import-export-utils";
import * as XLSX from "xlsx";

function escapeCsvCell(val: string): string {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";
    if (!["xlsx", "csv", "json"].includes(format)) {
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const { headers, sampleRow } = buildTemplateRows();
    const rowArray = headers.map((h) => String(sampleRow[h] ?? ""));

    const filename = `template_soal.${format}`;

    try {
        if (format === "json") {
            const arr = [Object.fromEntries(headers.map((h, i) => [h, rowArray[i]]))];
            const body = JSON.stringify(arr, null, 2);
            return new NextResponse(body, {
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        if (format === "csv") {
            const lines = [headers.join(","), rowArray.map(escapeCsvCell).join(",")];
            const csv = lines.join("\r\n");
            const bom = "\uFEFF";
            return new NextResponse(bom + csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        const wb = XLSX.utils.book_new();
        const wsData = [headers, rowArray];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error("Template export error:", err);
        return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
    }
}
