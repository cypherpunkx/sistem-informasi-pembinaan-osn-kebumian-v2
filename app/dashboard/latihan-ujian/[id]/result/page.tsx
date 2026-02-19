import Link from 'next/link';
import { CheckCircle, XCircle, ChevronLeft, RefreshCcw } from 'lucide-react';

export default async function ExamResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ score?: string; session?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const examId = parseInt(resolvedParams.id);
  const scoreArg = resolvedSearchParams?.score;
  // Ideally we fetch the session to get detailed stats

  // For now, rely on simpler display or fetch last session
  // Let's assume passed score is valid for quick feedback
  const score = scoreArg ? parseInt(scoreArg) : 0;

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
          href={`/dashboard/latihan-ujian/${examId}`}
          className="flex items-center gap-2 px-6 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
        >
          <RefreshCcw className="w-4 h-4" /> Try Again
        </Link>
      </div>
    </div>
  );
}
