import ExamForm from "@/components/dashboard/exam/ExamForm";
import { getDistinctQuestionTopics, getDistinctExamCategories } from "@/app/actions/exams";

export default async function NewExamPage() {
    const [topics, categories] = await Promise.all([
        getDistinctQuestionTopics(),
        getDistinctExamCategories(),
    ]);
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Buat Ujian</h1>
                    <p className="text-text-dark/60 mt-1">Paket tetap (soal dipilih) atau paket dinamis (soal acak dari filter).</p>
                </div>
            </div>
            <ExamForm topics={topics} categories={categories} />
        </div>
    );
}
