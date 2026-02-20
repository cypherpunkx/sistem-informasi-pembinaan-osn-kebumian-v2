import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import QuestionFilters from '@/components/dashboard/bank-soal/QuestionFilters';
import QuestionPreviewTrigger from '@/components/dashboard/bank-soal/QuestionPreviewTrigger';
import DeleteQuestionButton from '@/components/dashboard/bank-soal/DeleteQuestionButton';
import StatusBadge from '@/components/dashboard/StatusBadge';
import QuestionApprovalTable from '@/components/dashboard/bank-soal/QuestionApprovalTable';
import BankSoalImportExport from '@/components/dashboard/bank-soal/BankSoalImportExport';
import BankSoalTable from '@/components/dashboard/bank-soal/BankSoalTable';
import {
  getQuestionsFiltered,
  getPendingQuestionsFiltered,
  deleteQuestion,
  getQuestionExamUsage,
  updateQuestionStatus,
  type GetPendingQuestionsFilteredResult,
} from '@/app/actions/questions';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PAGE_SIZE = 10;

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    topic?: string;
    type?: string;
    status?: string;
    difficulty?: string;
    tab?: string;
    page?: string;
    limit?: string;
    approvalPage?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams?.tab || 'all';
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const page = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  const limitNum = parseInt(resolvedSearchParams?.limit || String(DEFAULT_PAGE_SIZE), 10);
  const limit = Number.isNaN(limitNum) || limitNum < DEFAULT_PAGE_SIZE
    ? DEFAULT_PAGE_SIZE
    : Math.min(100, Math.max(DEFAULT_PAGE_SIZE, limitNum));
  const approvalPageNum = parseInt(resolvedSearchParams?.approvalPage || '1', 10);
  const approvalPage = Number.isNaN(approvalPageNum) || approvalPageNum < 1 ? 1 : approvalPageNum;

  const session = await auth();
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, parseInt(session?.user?.id || '0')),
  });
  const isAdmin = currentUser?.role === 'admin';

  let data: {
    id: number;
    content: string;
    topic: string;
    type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
  }[] = [];
  let total = 0;
  let totalPages = 1;
  let pendingResult: GetPendingQuestionsFilteredResult = {
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: DEFAULT_PAGE_SIZE,
  };

  if (isAdmin) {
    pendingResult = await getPendingQuestionsFiltered({
      page: approvalPage,
      limit,
    });
  }

  if (currentTab === 'approval' && isAdmin) {
    data = [];
    total = 0;
    totalPages = 1;
  } else {
    const result = await getQuestionsFiltered({
      search: resolvedSearchParams?.search,
      topic: resolvedSearchParams?.topic,
      type: resolvedSearchParams?.type,
      status: resolvedSearchParams?.status,
      difficulty: resolvedSearchParams?.difficulty,
      page,
      limit,
    });
    data = result.data;
    total = result.total;
    totalPages = result.totalPages;
  }

  const formattedData = data.map((row) => ({
    id: row.id,
    content: (
      <div className="max-w-md truncate" title={row.content}>
        {row.content}
      </div>
    ),
    topic: row.topic,
    type: (
      <span
        className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
            ${
              row.type === 'MULTIPLE_CHOICE'
                ? 'bg-blue-100 text-blue-700'
                : row.type === 'ESSAY'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-orange-100 text-orange-700'
            }`}
      >
        {row.type.replace('_', ' ')}
      </span>
    ),
    difficulty: (
      <span
        className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
            ${
              row.difficulty === 'EASY'
                ? 'bg-green-100 text-green-700'
                : row.difficulty === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
      >
        {row.difficulty}
      </span>
    ),
    status: <StatusBadge status={row.status} />,
    actions: (
      <div className="flex items-center gap-2">
        {/* 
                  Quick Publish only for Admins or if logic allows. 
                  Since we have approval flow, maybe remove quick publish for drafts here 
                  or keep it only for admins? 
                  Let's keep it but restrict in action if needed.
                */}
        {isAdmin && (row.status === 'DRAFT' || row.status === 'PENDING') && (
          <form
            action={async () => {
              'use server';
              await updateQuestionStatus(row.id, 'PUBLISHED');
            }}
          >
            <button
              type="submit"
              className="text-green-600 hover:text-green-800 text-xs font-bold border border-green-200 px-2 py-1 rounded"
              title="Publish"
            >
              Publish
            </button>
          </form>
        )}

        <QuestionPreviewTrigger questionId={row.id} />
        <Link
          href={`/dashboard/bank-soal/edit/${row.id}`}
          className="text-text-dark/60 hover:text-blue-600"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <DeleteQuestionButton questionId={row.id} contentPreview={row.content} onDelete={deleteQuestion} getExamUsage={getQuestionExamUsage} />
      </div>
    ),
  }));

  const simpleColumns = [
    { header: 'Content', accessorKey: 'content' },
    { header: 'Topic', accessorKey: 'topic' },
    { header: 'Type', accessorKey: 'type' },
    { header: 'Difficulty', accessorKey: 'difficulty' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Actions', accessorKey: 'actions' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Bank Soal</h1>
          <p className="text-text-dark/60 mt-1">
            Manage your question repository.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/bank-soal/new"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question
          </Link>
          <BankSoalImportExport />
        </div>
      </div>

      {/* Admin Tabs */}
      {isAdmin && (
        <div className="border-b border-neutral-warm/20 flex gap-6">
          <Link
            href="/dashboard/bank-soal?tab=all"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${currentTab === 'all' ? 'border-accent-earthy text-accent-earthy' : 'border-transparent text-text-dark/60 hover:text-text-dark'}`}
          >
            All Questions
          </Link>
          <Link
            href="/dashboard/bank-soal?tab=approval"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${currentTab === 'approval' ? 'border-accent-earthy text-accent-earthy' : 'border-transparent text-text-dark/60 hover:text-text-dark'}`}
          >
            Needs Approval
            {pendingResult.total > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                {pendingResult.total}
              </span>
            )}
          </Link>
        </div>
      )}

      {currentTab === 'approval' && isAdmin ? (
        <QuestionApprovalTable
          questions={pendingResult.data}
          total={pendingResult.total}
          page={approvalPage}
          totalPages={pendingResult.totalPages}
          limit={pendingResult.limit}
        />
      ) : (
        <>
          <QuestionFilters />
          {total > 0 && (
            <p className="text-sm text-text-dark/60">
              Menampilkan {(page - 1) * limit + 1}–
              {Math.min(page * limit, total)} dari {total} soal
            </p>
          )}
          <BankSoalTable
            data={formattedData}
            columns={
              simpleColumns as {
                header: string;
                accessorKey:
                  | 'id'
                  | 'content'
                  | 'type'
                  | 'topic'
                  | 'difficulty'
                  | 'status'
                  | 'actions';
              }[]
            }
            currentPage={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
          />
        </>
      )}
    </div>
  );
}
