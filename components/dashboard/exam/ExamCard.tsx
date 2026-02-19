'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  FileQuestion,
  Pencil,
  MoreVertical,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';
import {
  deleteExam,
  toggleExamArchive,
  duplicateExam,
} from '@/app/actions/exams';
import DeleteExamModal from './DeleteExamModal';

type ExamRow = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  type: string;
  category: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
};

type ExamCounts = { questionCount: number; participantCount: number };

interface ExamCardProps {
  exam: ExamRow;
  counts: ExamCounts;
  typeLabel: string;
}

export default function ExamCard({ exam, counts, typeLabel }: ExamCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const result = await deleteExam(exam.id);
    setIsDeleting(false);
    if (result?.success) {
      setDeleteModalOpen(false);
      router.refresh();
    } else {
      alert(result?.message ?? 'Gagal menghapus ujian.');
    }
  };

  const handleArchive = async () => {
    setMenuOpen(false);
    setIsArchiving(true);
    const result = await toggleExamArchive(exam.id);
    setIsArchiving(false);
    if (result?.success) router.refresh();
    else alert(result?.message);
  };

  const handleDuplicate = async () => {
    setMenuOpen(false);
    setIsDuplicating(true);
    const result = await duplicateExam(exam.id);
    setIsDuplicating(false);
    if (result?.success) router.refresh();
    else alert(result?.message);
  };

  const openDeleteModal = () => {
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const subtitle = [exam.category || 'Umum', typeLabel]
    .filter(Boolean)
    .join(' • ');

  return (
    <>
      <div className="group relative bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden hover:shadow-md hover:border-accent-earthy/30 hover:-translate-y-0.5 transition-all duration-200">
        <Link
          href={`/dashboard/manajemen-ujian/${exam.id}`}
          className="block p-5 pr-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-earthy focus-visible:ring-inset"
        >
          <span
            className={`inline-block text-xs font-bold px-2 py-1 rounded shrink-0 mb-3
                            ${exam.isActive ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' : 'bg-gray-100 text-gray-600'}`}
          >
            {exam.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
          <h3 className="font-bold text-text-dark text-lg mb-0.5 group-hover:text-accent-earthy transition-colors">
            {exam.title}
          </h3>
          <p className="text-text-dark/60 text-sm mb-4">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-dark/70">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-accent-earthy shrink-0" />
              {exam.duration} Menit
            </span>
            <span className="flex items-center gap-1">
              <FileQuestion className="w-4 h-4 text-accent-earthy shrink-0" />
              {counts.questionCount} Soal
            </span>
          </div>
        </Link>
        <div className="absolute top-3 right-3 z-10" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="p-1.5 rounded-lg text-text-dark/60 hover:text-text-dark hover:bg-neutral-warm/20 transition-colors"
            aria-label="Menu ujian"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-warm/20 z-10"
              role="menu"
            >
              <Link
                href={`/dashboard/manajemen-ujian/edit/${exam.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-neutral-light"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Link>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-neutral-light disabled:opacity-50"
                role="menuitem"
              >
                <Copy className="w-4 h-4" />
                {isDuplicating ? '…' : 'Duplicate'}
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-neutral-light disabled:opacity-50"
                role="menuitem"
              >
                {exam.isActive ? (
                  <>
                    <Archive className="w-4 h-4" />
                    {isArchiving ? '…' : 'Arsipkan'}
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="w-4 h-4" />
                    {isArchiving ? '…' : 'Aktifkan'}
                  </>
                )}
              </button>
              <hr className="my-1 border-neutral-warm/20" />
              <button
                type="button"
                onClick={openDeleteModal}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                role="menuitem"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteExamModal
        open={deleteModalOpen}
        examTitle={exam.title}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
