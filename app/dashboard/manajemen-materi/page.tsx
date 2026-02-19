import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import MaterialFilter from '@/components/dashboard/materi/MaterialFilter';
import StatusBadge from '@/components/dashboard/materi/StatusBadge';
import MaterialPreviewTrigger from '@/components/dashboard/materi/MaterialPreviewTrigger';
import DeleteMaterialButton from '@/components/dashboard/materi/DeleteMaterialButton';
import ManajemenMateriPagination from '@/components/dashboard/materi/ManajemenMateriPagination';
import {
  getMaterialsFiltered,
  getPendingMaterialsFiltered,
  deleteMaterial,
  updateMaterialStatus,
} from '@/app/actions/materials';
import MaterialApprovalTable from '@/components/dashboard/materi/MaterialApprovalTable';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_PAGE_SIZE = 10;

export default async function MaterialManagementPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    topic?: string;
    type?: string;
    status?: string;
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

  let pendingResult: {
    data: Awaited<ReturnType<typeof getMaterialsFiltered>>['data'];
    total: number;
    totalPages: number;
    limit: number;
  } = {
    data: [],
    total: 0,
    totalPages: 1,
    limit: DEFAULT_PAGE_SIZE,
  };
  if (isAdmin) {
    const result = await getPendingMaterialsFiltered({
      page: approvalPage,
      limit,
    });
    pendingResult = {
      data: result.data,
      total: result.total,
      totalPages: result.totalPages,
      limit: result.limit,
    };
  }

  const {
    data: materials,
    total,
    totalPages,
  } = await getMaterialsFiltered({
    search: resolvedSearchParams?.search,
    topic: resolvedSearchParams?.topic,
    type: resolvedSearchParams?.type,
    status: resolvedSearchParams?.status,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">
            Manajemen Materi
          </h1>
          <p className="text-text-dark/60 mt-1">
            Upload and manage learning resources.
          </p>
        </div>
        <Link
          href="/dashboard/manajemen-materi/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Material
        </Link>
      </div>

      {isAdmin && (
        <div className="border-b border-neutral-warm/20 flex gap-6">
          <Link
            href="/dashboard/manajemen-materi?tab=all"
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${currentTab === 'all' ? 'border-accent-earthy text-accent-earthy' : 'border-transparent text-text-dark/60 hover:text-text-dark'}`}
          >
            Semua Materi
          </Link>
          <Link
            href="/dashboard/manajemen-materi?tab=approval"
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
        <MaterialApprovalTable
          materials={
            pendingResult.data as {
              id: number;
              title: string;
              url: string | null;
              topic: string;
              type: string;
              status: string;
              createdAt: Date | null;
            }[]
          }
          total={pendingResult.total}
          page={approvalPage}
          totalPages={pendingResult.totalPages}
          limit={pendingResult.limit}
        />
      ) : (
        <>
          <MaterialFilter />

          {total > 0 && (
            <p className="text-sm text-text-dark/60">
              Menampilkan {(page - 1) * limit + 1}–
              {Math.min(page * limit, total)} dari {total} materi
            </p>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-warm/20">
                <thead className="bg-neutral-light">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider"
                    >
                      Topic
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider"
                    >
                      Tags
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-warm/20">
                  {materials.length > 0 ? (
                    materials.map((material) => (
                      <tr
                        key={material.id}
                        className="hover:bg-neutral-warm/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="text-sm font-medium text-text-dark max-w-xs truncate"
                            title={material.title}
                          >
                            {material.title}
                          </div>
                          <div className="text-xs text-text-dark/50 max-w-xs truncate">
                            {material.url}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                          {material.topic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                ${
                                                  material.type === 'PDF'
                                                    ? 'bg-red-100 text-red-700'
                                                    : material.type === 'VIDEO'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : material.type ===
                                                          'SLIDE'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}
                          >
                            {material.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {Array.isArray(material.tags) &&
                              (material.tags as string[])
                                .slice(0, 2)
                                .map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-0.5 bg-neutral-warm/10 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                            {Array.isArray(material.tags) &&
                              (material.tags as string[]).length > 2 && (
                                <span className="text-xs px-2 py-0.5 bg-neutral-warm/10 rounded-full">
                                  ...
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={material.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                          <div className="flex items-center gap-2">
                            {/* Quick Status Actions — hanya admin yang boleh publish */}
                            {isAdmin &&
                              (material.status === 'DRAFT' ||
                                material.status === 'PENDING') && (
                                <form
                                  action={async () => {
                                    'use server';
                                    await updateMaterialStatus(
                                      material.id,
                                      'PUBLISHED',
                                    );
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

                            <MaterialPreviewTrigger materialId={material.id} />
                            <Link
                              href={`/dashboard/manajemen-materi/edit/${material.id}`}
                              className="text-text-dark/60 hover:text-blue-600"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <DeleteMaterialButton materialId={material.id} titlePreview={material.title} onDelete={deleteMaterial} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-text-dark/50 italic"
                      >
                        No materials found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ManajemenMateriPagination
              total={total}
              page={page}
              totalPages={totalPages}
              limit={limit}
            />
          </div>
        </>
      )}
    </div>
  );
}
