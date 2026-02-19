"use client";

import { useState, useCallback } from "react";
import { Upload, X, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { validateImportRows, commitImportQuestions } from "@/app/actions/questions-import";
import { CANONICAL_HEADERS, type CanonicalQuestionRow, type CanonicalHeader } from "@/lib/import-export-types";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const TEMPLATE_FORMATS = [
    { format: "xlsx", label: "Excel (.xlsx)" },
    { format: "csv", label: "CSV" },
    { format: "json", label: "JSON" },
];

function applyMapping(
    rawRows: Record<string, string>[],
    mapping: Partial<Record<CanonicalHeader, string>>
): CanonicalQuestionRow[] {
    return rawRows.map((raw) => {
        const get = (key: CanonicalHeader): string => {
            const col = mapping[key];
            if (!col) return "";
            const v = raw[col];
            return v != null ? String(v).trim() : "";
        };
        const type = get("type") || "MULTIPLE_CHOICE";
        const row: CanonicalQuestionRow = {
            content: get("content"),
            type: type as "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
            topic: get("topic"),
            subtopic: get("subtopic"),
            difficulty: (get("difficulty") || "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
            year: parseInt(get("year"), 10) || undefined,
            source: get("source"),
            explanation: get("explanation"),
            tags: get("tags"),
            status: (get("status") || "DRAFT") as "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED",
            weight: parseFloat(get("weight")) || 1,
        };
        if (type === "MULTIPLE_CHOICE") {
            row.option_1 = get("option_1");
            row.option_2 = get("option_2");
            row.option_3 = get("option_3");
            row.option_4 = get("option_4");
            row.option_5 = get("option_5");
            row.option_6 = get("option_6");
            const co = parseInt(get("correct_option"), 10);
            row.correct_option = isNaN(co) ? 0 : co;
        }
        if (type === "SHORT_ANSWER") row.answer_keys = get("answer_keys");
        if (type === "ESSAY") row.rubric = get("rubric");
        return row;
    });
}

function defaultMapping(fileHeaders: string[]): Partial<Record<CanonicalHeader, string>> {
    const map: Partial<Record<CanonicalHeader, string>> = {};
    const lower = (s: string) => s.trim().toLowerCase();
    for (const canon of CANONICAL_HEADERS) {
        const found = fileHeaders.find((h) => lower(h) === lower(canon));
        if (found) map[canon as CanonicalHeader] = found;
    }
    const aliases: Record<string, string> = {
        content: "soal",
        topic: "topik",
        type: "tipe",
        difficulty: "kesulitan",
        status: "status",
    };
    for (const [canon, alias] of Object.entries(aliases)) {
        if (!map[canon as CanonicalHeader]) {
            const found = fileHeaders.find((h) => lower(h) === alias);
            if (found) map[canon as CanonicalHeader] = found;
        }
    }
    return map;
}

export default function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
    const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
    const [columnMapping, setColumnMapping] = useState<Partial<Record<CanonicalHeader, string>>>({});
    const [checkDuplicate, setCheckDuplicate] = useState(true);
    const [validationResult, setValidationResult] = useState<{
        rows: CanonicalQuestionRow[];
        errors: { rowIndex: number; message: string }[];
    } | null>(null);
    const [commitResult, setCommitResult] = useState<{ successCount: number; failedRows: { rowIndex: number; message: string }[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const parseFile = useCallback((f: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> => {
        return new Promise((resolve, reject) => {
            const name = f.name.toLowerCase();
            if (name.endsWith(".json")) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const data = JSON.parse(reader.result as string);
                        const arr = Array.isArray(data) ? data : [data];
                        const headers = arr.length > 0 ? Object.keys(arr[0]) : [];
                        const rows = arr.map((r) => {
                            const row: Record<string, string> = {};
                            for (const k of Object.keys(r)) {
                                row[k] = r[k] != null ? String(r[k]) : "";
                            }
                            return row;
                        });
                        resolve({ headers, rows });
                    } catch (e) {
                        reject(e);
                    }
                };
                reader.readAsText(f, "UTF-8");
            } else if (name.endsWith(".csv")) {
                Papa.parse(f, {
                    header: true,
                    skipEmptyLines: true,
                    encoding: "UTF-8",
                    complete: (res) => {
                        const rows = (res.data || []) as Record<string, string>[];
                        const headers = res.meta?.fields || (rows[0] ? Object.keys(rows[0]) : []);
                        resolve({ headers, rows });
                    },
                    error: (err) => reject(err),
                });
            } else if (name.endsWith(".xlsx")) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const wb = XLSX.read(reader.result, { type: "array" });
                        const first = wb.SheetNames[0];
                        const sheet = wb.Sheets[first];
                        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as (string | number)[][];
                        const headers = (aoa[0] || []).map((c) => String(c));
                        const rows = (aoa.slice(1) || []).map((row) => {
                            const obj: Record<string, string> = {};
                            headers.forEach((h, i) => {
                                obj[h] = row[i] != null ? String(row[i]) : "";
                            });
                            return obj;
                        });
                        resolve({ headers, rows });
                    } catch (e) {
                        reject(e);
                    }
                };
                reader.readAsArrayBuffer(f);
            } else {
                reject(new Error("Format tidak didukung. Gunakan .xlsx, .csv, atau .json"));
            }
        });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setError("");
        setFile(f);
        setValidationResult(null);
        setCommitResult(null);
        parseFile(f)
            .then(({ headers, rows }) => {
                setFileHeaders(headers);
                setRawRows(rows);
                setColumnMapping(defaultMapping(headers));
                setStep("upload");
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Gagal memparse file");
            });
    };

    const handleValidate = async () => {
        if (rawRows.length === 0) {
            setError("Tidak ada baris data.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const canonical = applyMapping(rawRows, columnMapping);
            const result = await validateImportRows(canonical, { checkDuplicate });
            setValidationResult({ rows: result.rows, errors: result.errors });
            setStep("preview");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Validasi gagal");
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        if (!validationResult || validationResult.rows.length === 0) {
            setError("Tidak ada baris valid untuk di-import.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const result = await commitImportQuestions(validationResult.rows);
            setCommitResult(result);
            setStep("done");
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import gagal");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setFileHeaders([]);
        setRawRows([]);
        setColumnMapping({});
        setValidationResult(null);
        setCommitResult(null);
        setStep("upload");
        setError("");
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={handleClose}>
            <div
                className="bg-white rounded-xl shadow-lg border border-neutral-warm/20 w-full max-w-3xl my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-neutral-warm/20">
                    <h2 className="text-lg font-bold text-text-dark">Import Soal</h2>
                    <button type="button" onClick={handleClose} className="p-1 rounded hover:bg-neutral-light text-text-dark/70">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Template download */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-text-dark/70">Unduh template:</span>
                        {TEMPLATE_FORMATS.map(({ format, label }) => (
                            <a
                                key={format}
                                href={`/api/bank-soal/template?format=${format}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-neutral-warm/30 rounded-lg hover:bg-neutral-light text-text-dark"
                            >
                                <Download className="w-4 h-4" />
                                {label}
                            </a>
                        ))}
                    </div>

                    {/* File upload */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Pilih file (.xlsx, .csv, .json)</label>
                        <input
                            type="file"
                            accept=".xlsx,.csv,.json"
                            onChange={handleFileChange}
                            className="w-full text-sm text-text-dark file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-earthy file:text-white file:font-medium"
                        />
                        {file && (
                            <p className="text-xs text-text-dark/60 mt-1">
                                {file.name} — {rawRows.length} baris, {fileHeaders.length} kolom
                            </p>
                        )}
                    </div>

                    {/* Column mapping */}
                    {fileHeaders.length > 0 && (
                        <div className="border border-neutral-warm/20 rounded-lg p-3">
                            <p className="text-sm font-medium text-text-dark mb-2">Mapping kolom (file → sistem)</p>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {CANONICAL_HEADERS.slice(0, 12).map((h) => (
                                    <div key={h} className="flex items-center gap-2">
                                        <span className="text-xs text-text-dark/70 truncate w-24">{h}</span>
                                        <select
                                            value={columnMapping[h as CanonicalHeader] ?? ""}
                                            onChange={(e) => setColumnMapping((prev) => ({ ...prev, [h]: e.target.value || undefined }))}
                                            className="flex-1 min-w-0 text-xs px-2 py-1 border rounded bg-white"
                                        >
                                            <option value="">— tidak map</option>
                                            {fileHeaders.map((fh) => (
                                                <option key={fh} value={fh}>{fh}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-text-dark/50 mt-1">option_1..6, correct_option, answer_keys, rubric dipetakan sama.</p>
                        </div>
                    )}

                    <label className="flex items-center gap-2 text-sm text-text-dark">
                        <input
                            type="checkbox"
                            checked={checkDuplicate}
                            onChange={(e) => setCheckDuplicate(e.target.checked)}
                        />
                        Cek duplikat (content + topik)
                    </label>

                    {error && (
                        <div className="flex items-center gap-2 p-2 rounded bg-red-50 text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Preview */}
                    {step === "preview" && validationResult && (
                        <div className="border border-neutral-warm/20 rounded-lg p-3 max-h-60 overflow-auto">
                            <p className="text-sm font-medium text-text-dark mb-2">
                                Preview: {validationResult.rows.length} valid, {validationResult.errors.length} error
                            </p>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-1">#</th>
                                        <th className="text-left py-1">Konten (singkat)</th>
                                        <th className="text-left py-1">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validationResult.errors.slice(0, 20).map((e) => (
                                        <tr key={e.rowIndex} className="border-b text-red-600">
                                            <td className="py-1">{e.rowIndex}</td>
                                            <td className="py-1 truncate max-w-[200px]">—</td>
                                            <td className="py-1">{e.message}</td>
                                        </tr>
                                    ))}
                                    {validationResult.rows.slice(0, 10).map((_, i) => (
                                        <tr key={`v-${i}`} className="border-b text-green-700">
                                            <td className="py-1">{i + 1}</td>
                                            <td className="py-1 truncate max-w-[200px]">Valid</td>
                                            <td className="py-1"><CheckCircle className="w-4 h-4 inline" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {validationResult.errors.length > 20 && (
                                <p className="text-xs text-text-dark/50 mt-1">... dan {validationResult.errors.length - 20} error lainnya</p>
                            )}
                        </div>
                    )}

                    {step === "done" && commitResult && (
                        <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">
                            <p className="font-medium">Import selesai.</p>
                            <p>{commitResult.successCount} soal berhasil di-import.</p>
                            {commitResult.failedRows.length > 0 && (
                                <p className="mt-1 text-amber-700">
                                    {commitResult.failedRows.length} baris gagal: {commitResult.failedRows.map((f) => `#${f.rowIndex}: ${f.message}`).join("; ")}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-neutral-warm/20">
                    {step === "upload" && (
                        <>
                            <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-lg text-text-dark hover:bg-neutral-light">
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleValidate}
                                disabled={loading || rawRows.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-accent-earthy text-white font-medium rounded-lg hover:bg-accent-earthy/90 disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                                Validasi & Preview
                            </button>
                        </>
                    )}
                    {step === "preview" && validationResult && (
                        <>
                            <button type="button" onClick={() => setStep("upload")} className="px-4 py-2 border rounded-lg text-text-dark hover:bg-neutral-light">
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={handleCommit}
                                disabled={loading || validationResult.rows.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-60"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Commit ({validationResult.rows.length} soal)
                            </button>
                        </>
                    )}
                    {step === "done" && (
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-accent-earthy text-white font-medium rounded-lg hover:bg-accent-earthy/90">
                            Tutup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
