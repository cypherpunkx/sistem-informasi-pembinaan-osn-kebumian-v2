import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, CheckSquare } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import QuestionFilters from "@/components/dashboard/bank-soal/QuestionFilters";
import StatusBadge from "@/components/dashboard/StatusBadge";
import QuestionApprovalTable from "@/components/dashboard/bank-soal/QuestionApprovalTable";
import { getQuestions, deleteQuestion, updateQuestionStatus } from "@/app/actions/questions";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, questions } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

export default async function QuestionBankPage({
    searchParams,
}: {
    searchParams?: Promise<{
        search?: string;
        topic?: string;
        type?: string;
        status?: string;
        tab?: string;
    }>;
}) {
    const resolvedSearchParams = await searchParams;
    const currentTab = resolvedSearchParams?.tab || "all";

    // Check user role
    const session = await auth();
    const currentUser = await db.query.users.findFirst({
        where: eq(users.id, parseInt(session?.user?.id || "0")),
    });
    const isAdmin = currentUser?.role === "admin";

    // Fetch questions based on tab
    let data: any[] = [];
    let pendingQuestions: any[] = [];

    if (isAdmin) {
        // Admins fetch pending questions separately for the approval tab
        pendingQuestions = await db.query.questions.findMany({
            where: eq(questions.status, "PENDING"),
            orderBy: [desc(questions.createdAt)],
        });
    }

    if (currentTab === "approval" && isAdmin) {
        // If on approval tab, we use pendingQuestions
        // But the main table isn't used here, QuestionApprovalTable is.
    } else {
        // Normal fetch for "All Questions" tab
        data = await getQuestions({
            search: resolvedSearchParams?.search,
            topic: resolvedSearchParams?.topic,
            type: resolvedSearchParams?.type,
            status: resolvedSearchParams?.status
        });
    }

    const formattedData = data.map(row => ({
        id: row.id,
        content: (
            <div className="max-w-md truncate" title={row.content}>
                {row.content}
            </div>
        ),
        topic: row.topic,
        type: (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
            ${row.type === 'MULTIPLE_CHOICE' ? 'bg-blue-100 text-blue-700' :
                    row.type === 'ESSAY' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                {row.type.replace("_", " ")}
            </span>
        ),
        difficulty: (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
            ${row.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                    row.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {row.difficulty}
            </span>
        ),
        status: (
            <StatusBadge status={row.status} />
        ),
        actions: (
            <div className="flex items-center gap-2">
                {/* 
                  Quick Publish only for Admins or if logic allows. 
                  Since we have approval flow, maybe remove quick publish for drafts here 
                  or keep it only for admins? 
                  Let's keep it but restrict in action if needed.
                */}
                {isAdmin && (row.status === 'DRAFT' || row.status === 'PENDING') && (
                    <form action={async () => {
                        "use server";
                        await updateQuestionStatus(row.id, "PUBLISHED");
                    }}>
                        <button type="submit" className="text-green-600 hover:text-green-800 text-xs font-bold border border-green-200 px-2 py-1 rounded" title="Publish">
                            Publish
                        </button>
                    </form>
                )}

                <button className="text-text-dark/60 hover:text-accent-earthy" title="Preview">
                    <Eye className="w-4 h-4" />
                </button>
                <Link href={`/dashboard/bank-soal/edit/${row.id}`} className="text-text-dark/60 hover:text-blue-600" title="Edit">
                    <Pencil className="w-4 h-4" />
                </Link>
                <form action={async () => {
                    "use server";
                    await deleteQuestion(row.id);
                }}>
                    <button type="submit" className="text-text-dark/60 hover:text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </form>
            </div>
        )
    }));

    const simpleColumns = [
        { header: "Content", accessorKey: "content" },
        { header: "Topic", accessorKey: "topic" },
        { header: "Type", accessorKey: "type" },
        { header: "Difficulty", accessorKey: "difficulty" },
        { header: "Status", accessorKey: "status" },
        { header: "Actions", accessorKey: "actions" }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Bank Soal</h1>
                    <p className="text-text-dark/60 mt-1">Manage your question repository.</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/bank-soal/new"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Question
                    </Link>
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
                        {pendingQuestions.length > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                                {pendingQuestions.length}
                            </span>
                        )}
                    </Link>
                </div>
            )}

            {currentTab === 'approval' && isAdmin ? (
                <QuestionApprovalTable questions={pendingQuestions as any[]} />
            ) : (
                <>
                    <QuestionFilters />
                    <DataTable
                        data={formattedData as any[]}
                        columns={simpleColumns}
                    />
                </>
            )}
        </div>
    );
}
