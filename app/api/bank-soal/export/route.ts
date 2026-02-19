import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuestionsForExport } from "@/app/actions/questions-export";
import { questionsToCanonicalRows } from "@/lib/import-export-utils";
import { CANONICAL_HEADERS } from "@/lib/import-export-types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MAX_ROWS = 2000;

function escapeCsvCell(val: string): string {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
    const headers = [...CANONICAL_HEADERS];
    const lines = [headers.join(",")];
    for (const row of rows) {
        const cells = headers.map((h) => escapeCsvCell(String(row[h] ?? "")));
        lines.push(cells.join(","));
    }
    return lines.join("\r\n");
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx";
    if (!["xlsx", "csv", "json", "pdf"].includes(format)) {
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const filter = {
        topic: searchParams.get("topic") ?? undefined,
        difficulty: searchParams.get("difficulty") ?? undefined,
        createdAtFrom: searchParams.get("createdAtFrom") ?? undefined,
        createdAtTo: searchParams.get("createdAtTo") ?? undefined,
        createdBy: searchParams.get("createdBy") ?? undefined,
    };

    const questionsWithOptions = await getQuestionsForExport(filter);
    if (questionsWithOptions.length > MAX_ROWS) {
        return NextResponse.json(
            { error: `Too many rows. Maximum ${MAX_ROWS} allowed. Apply filters.` },
            { status: 400 }
        );
    }

    const rows = questionsToCanonicalRows(questionsWithOptions);
    const headers = [...CANONICAL_HEADERS];

    const baseName = `export_soal_${new Date().toISOString().slice(0, 10)}`;

    try {
        if (format === "json") {
            const body = JSON.stringify(rows, null, 2);
            return new NextResponse(body, {
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="${baseName}.json"`,
                },
            });
        }

        if (format === "csv") {
            const csv = toCsv(rows as unknown as Record<string, unknown>[]);
            const bom = "\uFEFF";
            return new NextResponse(bom + csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${baseName}.csv"`,
                },
            });
        }

        if (format === "xlsx") {
            const wb = XLSX.utils.book_new();
            const wsData = [headers, ...rows.map((r) => headers.map((h) => (r as unknown as Record<string, unknown>)[h] ?? ""))];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Soal");
            const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
                },
            });
        }

        if (format === "pdf") {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            doc.setFontSize(14);
            doc.text("Export Bank Soal", 14, 15);
            doc.setFontSize(10);
            const tableData = rows.map((r, i) => [
                i + 1,
                (r.content || "").slice(0, 40) + ((r.content?.length ?? 0) > 40 ? "..." : ""),
                r.topic ?? "",
                r.type ?? "",
                r.difficulty ?? "",
            ]);
            autoTable(doc, {
                head: [["No", "Konten (singkat)", "Topik", "Tipe", "Kesulitan"]],
                body: tableData,
                startY: 22,
                styles: { fontSize: 8 },
            });
            const buf = Buffer.from(doc.output("arraybuffer"));
            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
                },
            });
        }
    } catch (err) {
        console.error("Export error:", err);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}
