import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getExamDetailData } from '@/app/actions/exams';
import ExamDetailView from '@/components/dashboard/exam/ExamDetailView';

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const examId = parseInt(id, 10);
  if (Number.isNaN(examId)) notFound();

  const data = await getExamDetailData(examId);
  if (!data) notFound();

  return (
    <div className="space-y-8">
      <nav className="text-sm text-text-dark/70" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link
              href="/dashboard"
              className="hover:text-text-dark transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li className="text-text-dark/50" aria-hidden>
            /
          </li>
          <li>
            <Link
              href="/dashboard/manajemen-ujian"
              className="hover:text-text-dark transition-colors"
            >
              Manajemen Ujian
            </Link>
          </li>
          <li className="text-text-dark/50" aria-hidden>
            /
          </li>
          <li className="text-text-dark font-medium" aria-current="page">
            {data.exam.title}
          </li>
        </ol>
      </nav>

      <ExamDetailView
        exam={data.exam}
        questionCount={data.questionCount}
        participantCount={data.participantCount}
        stats={data.stats}
        participants={data.participants}
        questionsList={data.questionsList.filter((q): q is { id: number; content: string | null } => q.id != null)}
      />
    </div>
  );
}
