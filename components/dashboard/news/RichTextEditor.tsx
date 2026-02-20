"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Heading2,
    Undo,
    Redo,
} from "lucide-react";

const activeBtnClass = "bg-accent-earthy/25 text-accent-earthy ring-1 ring-accent-earthy/50 ring-inset";
const inactiveBtnClass = "text-text-dark hover:bg-neutral-warm/40";

interface RichTextEditorProps {
    initialContent: string;
    onContentChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

function Toolbar({ editor, tick }: { editor: Editor | null; tick: number }) {
    const addLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt("URL link:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt("URL gambar:");
        if (url) editor.chain().focus().setImage({ src: url }).run();
    }, [editor]);

    if (!editor) {
        return (
            <div className="flex flex-wrap items-center gap-1 p-2 border border-b-0 border-neutral-warm/40 rounded-t-lg bg-neutral-light/40 min-h-[42px]" aria-hidden />
        );
    }

    const btn = (active: boolean) =>
        `p-2 rounded transition-colors transition-shadow duration-150 ${active ? activeBtnClass : inactiveBtnClass}`;

    return (
        <div
            className="flex flex-wrap items-center gap-1 p-2 border border-b-0 border-neutral-warm/40 rounded-t-lg bg-neutral-light/50"
            role="toolbar"
            aria-label="Format konten"
        >
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={btn(editor.isActive("bold"))}
                title="Tebal (Ctrl+B)"
                aria-pressed={editor.isActive("bold")}
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={btn(editor.isActive("italic"))}
                title="Miring (Ctrl+I)"
                aria-pressed={editor.isActive("italic")}
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={btn(editor.isActive("heading", { level: 2 }))}
                title="Subjudul H2"
                aria-pressed={editor.isActive("heading", { level: 2 })}
            >
                <Heading2 className="w-4 h-4" />
            </button>
            <span className="w-px h-5 bg-neutral-warm/40 mx-0.5" aria-hidden />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={btn(editor.isActive("bulletList"))}
                title="Daftar bullet"
                aria-pressed={editor.isActive("bulletList")}
            >
                <List className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={btn(editor.isActive("orderedList"))}
                title="Daftar nomor"
                aria-pressed={editor.isActive("orderedList")}
            >
                <ListOrdered className="w-4 h-4" />
            </button>
            <span className="w-px h-5 bg-neutral-warm/40 mx-0.5" aria-hidden />
            <button
                type="button"
                onClick={addLink}
                className={btn(editor.isActive("link"))}
                title="Sisipkan link"
                aria-pressed={editor.isActive("link")}
            >
                <LinkIcon className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={addImage}
                className={btn(false)}
                title="Sisipkan gambar"
            >
                <ImageIcon className="w-4 h-4" />
            </button>
            <span className="w-px h-5 bg-neutral-warm/40 mx-0.5" aria-hidden />
            <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className={`p-2 rounded ${inactiveBtnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Undo"
                aria-label="Undo"
            >
                <Undo className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className={`p-2 rounded ${inactiveBtnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Redo"
                aria-label="Redo"
            >
                <Redo className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function RichTextEditor({
    initialContent,
    onContentChange,
    placeholder = "Tulis konten artikel…",
    className = "",
}: RichTextEditorProps) {
    const callbackRef = useRef(onContentChange);
    callbackRef.current = onContentChange;
    const editorRef = useRef<Editor | null>(null);
    const [toolbarTick, setToolbarTick] = useState(0);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ link: false }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent-earthy underline" } }),
            Image.configure({ HTMLAttributes: { class: "max-w-full h-auto rounded-lg" } }),
        ],
        content: initialContent || "",
        editorProps: {
            attributes: {
                class: "min-h-[280px] px-4 py-3 text-text-dark prose prose-sm max-w-none focus:outline-none",
            },
            handleDOMEvents: {
                blur: () => {
                    const html = editorRef.current?.getHTML() ?? "";
                    callbackRef.current(html);
                },
            },
        },
    });

    editorRef.current = editor;

    useEffect(() => {
        if (!editor) return;
        const handler = () => callbackRef.current(editor.getHTML());
        editor.on("update", handler);
        return () => {
            editor.off("update", handler);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor) return;
        const onTransaction = () => setToolbarTick((t) => t + 1);
        editor.on("selectionUpdate", onTransaction);
        editor.on("transaction", onTransaction);
        return () => {
            editor.off("selectionUpdate", onTransaction);
            editor.off("transaction", onTransaction);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor) return;
        const current = initialContent || "";
        if (editor.getHTML() !== current) {
            editor.commands.setContent(current, { emitUpdate: false });
            callbackRef.current(editor.getHTML());
        }
    }, [initialContent, editor]);

    return (
        <div className={className}>
            <Toolbar editor={editor} tick={toolbarTick} />
            <div className="rounded-b-lg border border-t-0 border-neutral-warm/40 min-h-[280px] bg-white focus-within:ring-2 focus-within:ring-accent-earthy/40 focus-within:border-accent-earthy/50 transition-shadow duration-150 [&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-text-dark [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:pl-6">
                <EditorContent editor={editor} />
            </div>
            <p className="text-xs text-text-dark/45 mt-1.5">{placeholder}</p>
        </div>
    );
}
