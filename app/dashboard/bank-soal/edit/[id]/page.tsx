import QuestionForm from "@/components/dashboard/bank-soal/QuestionForm";
import { getQuestionById } from "@/app/actions/questions";
import { getTopics } from "@/app/actions/topics";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) notFound();

    const [question, existingTopics] = await Promise.all([getQuestionById(id), getTopics()]);
    const session = await auth();
    const userRole = session?.user?.role || "pembina";

    if (!question) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-dark">Edit Question</h1>
            <QuestionForm initialData={question} userRole={userRole} existingTopics={existingTopics} />
        </div>
    );
}
