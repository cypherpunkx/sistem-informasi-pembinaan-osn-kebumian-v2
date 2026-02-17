import ExamForm from "@/components/dashboard/exam/ExamForm";

export default function NewExamPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Create New Exam</h1>
                    <p className="text-text-dark/60 mt-1">Design a fixed exam package with specific questions.</p>
                </div>
            </div>
            <ExamForm />
        </div>
    );
}
