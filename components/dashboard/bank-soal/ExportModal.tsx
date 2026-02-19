"use client";

import { useState, useEffect } from "react";
import { Download, X, Loader2 } from "lucide-react";
import { getTopics } from "@/app/actions/topics";
import { getQuestionCreators } from "@/app/actions/questions-export";

interface ExportModalProps {
    open: boolean;
    onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
    const [format, setFormat] = useState<"xlsx" | "csv" | "json" | "pdf">("xlsx");
    const [topic, setTopic] = useState("All");
    const [difficulty, setDifficulty] = useState("All");
    const [createdAtFrom, setCreatedAtFrom] = useState("");
    const [createdAtTo, setCreatedAtTo] = useState("");
    const [createdBy, setCreatedBy] = useState("All");
    const [topics, setTopics] = useState<{ id: number; name: string }[]>([]);
    const [creators, setCreators] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        getTopics().then((t) => setTopics(t));
        getQuestionCreators().then((c) => setCreators(c));
    }, [open]);

    const handleDownload = () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("format", format);
        if (topic && topic !== "All") params.set("topic", topic);
        if (difficulty && difficulty !== "All") params.set("difficulty", difficulty);
        if (createdAtFrom) params.set("createdAtFrom", createdAtFrom);
        if (createdAtTo) params.set("createdAtTo", createdAtTo);
        if (createdBy && createdBy !== "All") params.set("createdBy", createdBy);
        const url = `/api/bank-soal/export?${params.toString()}`;
        window.open(url, "_blank");
        setLoading(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-lg border border-neutral-warm/20 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-neutral-warm/20">
                    <h2 className="text-lg font-bold text-text-dark">Export Soal</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded hover:bg-neutral-light text-text-dark/70">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Format</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as "xlsx" | "csv" | "json" | "pdf")}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white"
                        >
                            <option value="xlsx">Excel (.xlsx)</option>
                            <option value="csv">CSV</option>
                            <option value="json">JSON</option>
                            <option value="pdf">PDF (cetak)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Kategori (Topik)</label>
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white"
                        >
                            <option value="All">Semua</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Tingkat kesulitan</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white"
                        >
                            <option value="All">Semua</option>
                            <option value="EASY">Mudah</option>
                            <option value="MEDIUM">Sedang</option>
                            <option value="HARD">Sulit</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Tanggal dari</label>
                            <input
                                type="date"
                                value={createdAtFrom}
                                onChange={(e) => setCreatedAtFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">Tanggal sampai</label>
                            <input
                                type="date"
                                value={createdAtTo}
                                onChange={(e) => setCreatedAtTo(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Pembuat soal</label>
                        <select
                            value={createdBy}
                            onChange={(e) => setCreatedBy(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg bg-white"
                        >
                            <option value="All">Semua</option>
                            {creators.map((c) => (
                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-neutral-warm/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-neutral-warm/30 rounded-lg text-text-dark hover:bg-neutral-light"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-earthy text-white font-medium rounded-lg hover:bg-accent-earthy/90 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Unduh
                    </button>
                </div>
            </div>
        </div>
    );
}
