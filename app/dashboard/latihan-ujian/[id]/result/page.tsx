import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, XCircle, ChevronLeft, RefreshCcw } from 'lucide-react';
import { getExamResult } from '@/app/actions/exams';

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  // Redirect dari ExamInterface mengirim result/{sessionId}; [id] = sessionId
  const sessionId = parseInt(resolvedParams.id, 10);
  if (Number.isNaN(sessionId) || sessionId <= 0) {
    redirect('/dashboard/latihan-ujian');
  }
  const result = await getExamResult(sessionId);
  if (!result.success || !result.session || !result.exam) {
    redirect('/dashboard/latihan-ujian');
  }
  const score = result.session.score ?? 0;
  const examId = result.exam.id;
  const tryAgainHref = `/dashboard/latihan-ujian/${examId}`;

  // Determine grade/color
  let gradeColor = 'text-red-600';
  let gradeMessage = 'Keep practicing!';
  if (score >= 80) {
    gradeColor = 'text-green-600';
    gradeMessage = 'Excellent work!';
  } else if (score >= 60) {
    gradeColor = 'text-yellow-600';
    gradeMessage = 'Good job, but room for improvement.';
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-neutral-warm/20 text-center max-w-2xl mx-auto mt-10">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-current ${score >= 60 ? 'text-green-100' : 'text-red-100'}`}
      >
        {score >= 60 ? (
          <CheckCircle
            className={`w-12 h-12 ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}
          />
        ) : (
          <XCircle className="w-12 h-12 text-red-600" />
        )}
      </div>

      <h1 className="text-3xl font-bold text-text-dark mb-2">
        Exam Completed!
      </h1>
      <p className="text-text-dark/60 mb-8">You have finished the exam.</p>

      <div className="bg-neutral-light/30 rounded-xl p-8 w-full mb-8">
        <p className="text-text-dark/60 text-sm uppercase tracking-wider font-bold mb-2">
          Your Score
        </p>
        <div className={`text-6xl font-black ${gradeColor}`}>{score}</div>
        <p className={`mt-2 font-medium ${gradeColor}`}>{gradeMessage}</p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard/latihan-ujian"
          className="flex items-center gap-2 px-6 py-2 border border-neutral-warm/30 rounded-lg text-text-dark hover:bg-neutral-light transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to List
        </Link>
        <Link
          href={tryAgainHref}
          className="flex items-center gap-2 px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
        >
          <RefreshCcw className="w-4 h-4" /> Coba Lagi
        </Link>
      </div>
    </div>
  );
}
