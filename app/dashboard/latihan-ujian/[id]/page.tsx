// This needs to be a Client Component if it uses `useRouter` etc., OR wrap the internal logic in Client Component
// Actually, `ExamInterface` is "use client", so this page can stay Server Component but pass ID.

import ExamInterface from "@/components/dashboard/exam/ExamInterface";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    return <ExamInterface examId={id} />;
}
