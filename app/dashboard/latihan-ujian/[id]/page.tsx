import { redirect } from "next/navigation";
import ExamInterface from "@/components/dashboard/exam/ExamInterface";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(id) || id <= 0) {
        redirect("/dashboard/latihan-ujian");
    }

    return <ExamInterface examId={id} />;
}
