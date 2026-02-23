import ExamForm from "@/components/dashboard/exam/ExamForm";
import { getExamById, getDistinctQuestionTopics, getDistinctExamCategories } from "@/app/actions/exams";
import { notFound } from "next/navigation";

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [exam, topics, categories] = await Promise.all([
        getExamById(parseInt(id)),
        getDistinctQuestionTopics(),
        getDistinctExamCategories(),
    ]);

    if (!exam) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Edit Ujian</h1>
                    <p className="text-text-dark/60 mt-1">
                        {exam.type === "DYNAMIC" ? "Ubah detail dan filter paket dinamis." : "Ubah detail dan soal paket tetap."}
                    </p>
                </div>
            </div>
            <ExamForm initialData={exam} topics={topics} categories={categories} />
        </div>
    );
}
