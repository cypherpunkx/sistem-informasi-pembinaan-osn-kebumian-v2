import QuestionForm from "@/components/dashboard/bank-soal/QuestionForm";
import { getQuestionById } from "@/app/actions/questions";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) notFound();

    const question = await getQuestionById(id);
    const session = await auth();
    const userRole = session?.user?.role || "pembina";

    if (!question) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-dark">Edit Question</h1>
            <QuestionForm initialData={question} userRole={userRole} />
        </div>
    );
}
