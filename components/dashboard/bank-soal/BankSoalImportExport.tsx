"use client";

import { useState } from "react";
import { Upload, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";

export default function BankSoalImportExport() {
    const router = useRouter();
    const [importOpen, setImportOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    return (
        <>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-warm/30 text-text-dark font-medium rounded-lg hover:bg-neutral-light transition-colors"
                >
                    <Upload className="w-4 h-4" /> Import Soal
                </button>
                <button
                    type="button"
                    onClick={() => setExportOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-warm/30 text-text-dark font-medium rounded-lg hover:bg-neutral-light transition-colors"
                >
                    <Download className="w-4 h-4" /> Export Soal
                </button>
            </div>
            <ImportModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onSuccess={() => router.refresh()}
            />
            <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
        </>
    );
}
