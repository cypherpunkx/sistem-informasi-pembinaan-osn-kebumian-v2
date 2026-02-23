import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getExamsFiltered, getExamCountsForIds } from '@/app/actions/exams';
import ExamCard from '@/components/dashboard/exam/ExamCard';
import ExamFilters from '@/components/dashboard/exam/ExamFilters';
import ExamPagination from '@/components/dashboard/exam/ExamPagination';

const DEFAULT_LIMIT = 12;

export default async function ExamManagementPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    type?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const pageNum = parseInt(params?.page ?? '1', 10);
  const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  const {
    data: exams,
    total,
    totalPages,
    limit,
  } = await getExamsFiltered({
    search: params?.search,
    type: params?.type,
    category: params?.category,
    status: params?.status ?? 'all',
    page,
    limit: DEFAULT_LIMIT,
  });

  const countsList =
    exams.length > 0 ? await getExamCountsForIds(exams.map((e) => e.id)) : [];
  const countsMap = new Map(countsList.map((c) => [c.examId, c]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Manajemen Ujian</h1>
          <p className="text-text-dark/60 mt-1">Buat dan kelola paket ujian.</p>
        </div>
        <Link
          href="/dashboard/manajemen-ujian/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Buat Ujian
        </Link>
      </div>

      <ExamFilters />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.length > 0 ? (
          exams.map((exam) => {
            const counts = countsMap.get(exam.id) ?? { questionCount: 0, participantCount: 0 };
            const typeLabel = exam.type === 'FIXED' ? 'Standar' : 'Adaptif';
            return (
              <ExamCard
                key={exam.id}
                exam={{
                  id: exam.id,
                  title: exam.title,
                  description: exam.description,
                  duration: exam.duration,
                  type: exam.type,
                  category: exam.category,
                  isActive: exam.isActive,
                  createdAt: exam.createdAt,
                  availableStart: exam.availableStart ?? undefined,
                  availableEnd: exam.availableEnd ?? undefined,
                }}
                counts={counts}
                typeLabel={typeLabel}
              />
            );
          })
        ) : (
          <div className="col-span-full bg-white p-12 rounded-xl text-center border border-neutral-warm/20">
            <p className="text-text-dark/50 italic">
              {params?.search ||
              params?.type ||
              params?.category ||
              params?.status
                ? 'Tidak ada ujian yang sesuai filter. Coba ubah filter atau reset.'
                : 'Belum ada ujian. Buat ujian pertama untuk memulai.'}
            </p>
          </div>
        )}
      </div>

      <ExamPagination
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
      />
    </div>
  );
}
