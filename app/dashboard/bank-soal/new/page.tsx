import QuestionForm from "@/components/dashboard/bank-soal/QuestionForm";
import { auth } from "@/auth";
import { getTopics } from "@/app/actions/topics";

export default async function NewQuestionPage() {
    const session = await auth();
    const userRole = session?.user?.role || "pembina";
    const existingTopics = await getTopics();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-text-dark">Add New Question</h1>
            <QuestionForm userRole={userRole} existingTopics={existingTopics} />
        </div>
    );
}
