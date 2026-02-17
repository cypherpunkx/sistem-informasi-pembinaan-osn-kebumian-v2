"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";
import { createPortal } from "react-dom";

interface FeedbackBadgeProps {
    feedback: string;
}

export default function FeedbackBadge({ feedback }: FeedbackBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    if (!feedback) return null;

    return (
        <>
            <button
                onClick={openModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                title="View Instructor Feedback"
            >
                <MessageSquare className="w-3.5 h-3.5" />
                View Feedback
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-warm/20 bg-neutral-light/30">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <h3 className="font-semibold text-text-dark">Instructor Feedback</h3>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-1 rounded-full text-text-dark/40 hover:bg-neutral-warm/10 hover:text-text-dark transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="prose prose-sm max-w-none text-text-dark whitespace-pre-wrap">
                                {feedback}
                            </div>
                        </div>

                        <div className="p-4 border-t border-neutral-warm/20 bg-neutral-light/30 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-text-dark bg-white border border-neutral-warm/30 rounded-lg hover:bg-neutral-light transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={closeModal} />
                </div>,
                document.body
            )}
        </>
    );
}
