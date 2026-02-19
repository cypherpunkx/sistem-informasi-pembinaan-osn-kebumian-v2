import { Suspense } from 'react';
import {
  getStudentExamSessions,
  getNilaiStats,
  getStudentsForFilter,
  getExamsForFilter,
} from '@/app/actions/nilai';
import NilaiContent from '@/components/dashboard/nilai/NilaiContent';
import { FileCheck, MessageSquare, TrendingUp } from 'lucide-react';

const SCALE_MAX = 100;

function scoreLabel(score: number): { text: string; className: string } {
  if (score >= 75)
    return { text: 'Good', className: 'bg-emerald-100 text-emerald-800' };
  if (score >= 60)
    return { text: 'Medium', className: 'bg-amber-100 text-amber-800' };
  return { text: 'Low', className: 'bg-red-100 text-red-800' };
}

function AvgScoreDisplay({ score }: { score: string | number }) {
  const num = typeof score === 'string' ? parseFloat(score) : score;
  const safe = Number.isNaN(num) ? 0 : num;
  const label = scoreLabel(safe);
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className="font-bold text-text-dark">{safe.toFixed(1)}</span>
      <span className="text-text-dark/50 text-sm font-normal">
        / {SCALE_MAX}
      </span>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${label.className}`}
      >
        {label.text}
      </span>
    </span>
  );
}

export default async function NilaiPage() {
  // Fetch initial data
  const stats = await getNilaiStats();
  const initialSessions = await getStudentExamSessions({ page: 1, limit: 20 });
  const students = await getStudentsForFilter();
  const examsList = await getExamsForFilter();

  if (!stats) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600">
          Unauthorized access. This page is for pembina only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Nilai & Feedback</h1>
        <p className="text-text-dark/60 mt-2">
          Review student exam results and provide personalized feedback.
        </p>
      </div>

      {/* Stats Cards — Pending Feedback paling menonjol (action-driven) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-amber-50/80 rounded-xl shadow-sm border-2 border-amber-400 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-1 right-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded">
              Perlu ditindak
            </span>
          </div>
          <div className="p-3 bg-amber-500 text-white rounded-full shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Pending Feedback
            </p>
            <p className="text-2xl font-bold text-amber-900">
              {stats.pendingFeedback}
            </p>
            <p className="text-xs text-amber-700/80 mt-0.5">
              sesi menunggu review
            </p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-dark/60">Total Sessions</p>
            <p className="text-2xl font-bold text-text-dark">
              {stats.totalSessions}
            </p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-dark/60">With Feedback</p>
            <p className="text-2xl font-bold text-text-dark">
              {stats.withFeedback}
            </p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-warm/20 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-dark/60">Avg. Score</p>
            <p className="text-xl font-bold text-text-dark flex flex-wrap items-center gap-1.5">
              <AvgScoreDisplay score={stats.avgClassScore} />
            </p>
          </div>
        </div>
      </div>

      {/* Main Content with Filters and Table */}
      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <NilaiContent
          initialSessions={initialSessions}
          students={students}
          examsList={examsList}
        />
      </Suspense>
    </div>
  );
}
