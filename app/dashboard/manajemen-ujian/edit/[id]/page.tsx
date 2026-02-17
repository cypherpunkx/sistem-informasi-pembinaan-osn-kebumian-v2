import ExamForm from "@/components/dashboard/exam/ExamForm";
import { getExamById } from "@/app/actions/exams";
import { notFound } from "next/navigation";

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const exam = await getExamById(parseInt(id));

    if (!exam) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Edit Exam</h1>
                    <p className="text-text-dark/60 mt-1">Update exam details and questions.</p>
                </div>
            </div>
            <ExamForm initialData={exam} />
        </div>
    );
}
