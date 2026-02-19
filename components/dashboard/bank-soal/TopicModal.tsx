"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { getTopics, createTopic, updateTopic, deleteTopic, type TopicRecord } from "@/app/actions/topics";

interface TopicModalProps {
    open: boolean;
    onClose: () => void;
    onTopicsChange: (topics: TopicRecord[]) => void;
}

export default function TopicModal({ open, onClose, onTopicsChange }: TopicModalProps) {
    const [topics, setTopics] = useState<TopicRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        if (open) {
            setLoading(true);
            getTopics().then((t) => {
                setTopics(t);
                setLoading(false);
            });
            setError(null);
            setNewName("");
            setEditId(null);
        }
    }, [open]);

    const handleCreate = () => {
        if (!newName.trim()) {
            setError("Nama topik tidak boleh kosong");
            return;
        }
        setError(null);
        startTransition(async () => {
            const result = await createTopic(newName.trim());
            if (result.success) {
                const updated = await getTopics();
                setTopics(updated);
                onTopicsChange(updated);
                setNewName("");
            } else {
                setError(result.message || "Gagal menambah topik");
            }
        });
    };

    const handleUpdate = (id: number) => {
        if (!editName.trim()) return;
        startTransition(async () => {
            const result = await updateTopic(id, editName.trim());
            if (result.success) {
                const updated = await getTopics();
                setTopics(updated);
                onTopicsChange(updated);
                setEditId(null);
            } else {
                setError(result.message || "Gagal mengubah topik");
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm("Yakin ingin menghapus topik ini?")) return;
        startTransition(async () => {
            const result = await deleteTopic(id);
            if (result.success) {
                const updated = await getTopics();
                setTopics(updated);
                onTopicsChange(updated);
                setEditId(null);
            } else {
                setError(result.message || "Gagal menghapus topik");
            }
        });
    };

    const handleClose = () => {
        setEditId(null);
        setError(null);
        onClose();
    };

    if (!open) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
            aria-modal="true"
            aria-labelledby="topic-modal-title"
        >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-neutral-warm/20">
                    <h2 id="topic-modal-title" className="text-lg font-bold text-text-dark flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        Kelola Topik
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-neutral-light/50 text-text-dark"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Add form */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nama topik baru (contoh: Geology)"
                            className="flex-1 px-3 py-2 border border-neutral-warm/30 rounded-lg focus:ring-2 focus:ring-accent-earthy focus:border-transparent"
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            disabled={pending}
                        />
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={pending || !newName.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Tambah
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* List */}
                    <div>
                        <p className="text-sm font-medium text-text-dark mb-2">Daftar Topik</p>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-accent-earthy" />
                            </div>
                        ) : topics.length === 0 ? (
                            <p className="text-sm text-text-dark/50 py-4 italic">Belum ada topik. Tambah topik baru di atas.</p>
                        ) : (
                            <ul className="space-y-2">
                                {topics.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex items-center justify-between gap-2 p-3 rounded-lg border border-neutral-warm/20 bg-white hover:bg-neutral-light/30"
                                    >
                                        {editId === t.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 px-2 py-1.5 border border-neutral-warm/30 rounded text-sm"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdate(t.id);
                                                        if (e.key === "Escape") setEditId(null);
                                                    }}
                                                    disabled={pending}
                                                />
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdate(t.id)}
                                                        disabled={pending || !editName.trim()}
                                                        className="p-2 rounded bg-accent-earthy text-white hover:bg-accent-earthy/90 disabled:opacity-50"
                                                        aria-label="Simpan"
                                                    >
                                                        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditId(null)}
                                                        className="p-2 rounded border border-neutral-warm/30 hover:bg-neutral-light/50"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-text-dark font-medium">{t.name}</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditId(t.id);
                                                            setEditName(t.name);
                                                            setError(null);
                                                        }}
                                                        className="p-2 rounded hover:bg-neutral-light/50 text-text-dark"
                                                        aria-label="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(t.id)}
                                                        disabled={pending}
                                                        className="p-2 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
                                                        aria-label="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-neutral-warm/20">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full px-4 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 text-text-dark font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
