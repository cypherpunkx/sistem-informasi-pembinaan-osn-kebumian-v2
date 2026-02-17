import Link from "next/link";
import { Plus, Eye, Pencil, Trash2, Calendar, Clock, BookOpen } from "lucide-react";
import { getExams } from "@/app/actions/exams";
import DeleteExamButton from "@/components/dashboard/exam/DeleteExamButton";

export default async function ExamManagementPage() {
    const exams = await getExams();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-dark">Manajemen Ujian</h1>
                    <p className="text-text-dark/60 mt-1">Create and manage exam packages.</p>
                </div>
                <Link
                    href="/dashboard/manajemen-ujian/new"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
                >
                    <Plus className="w-4 h-4" /> Create Exam
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.length > 0 ? (
                    exams.map((exam) => (
                        <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide
                                        ${exam.type === 'FIXED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {exam.type}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded 
                                        ${exam.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {exam.isActive ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-text-dark text-lg mb-2">{exam.title}</h3>
                                <p className="text-text-dark/70 text-sm line-clamp-2 mb-4">
                                    {exam.description || "No description provided."}
                                </p>

                                <div className="space-y-2 text-sm text-text-dark/60">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-accent-earthy" />
                                        <span>{exam.duration} Minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-accent-earthy" />
                                        <span>{exam.category || "General"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-neutral-warm/20 bg-neutral-light/20 flex justify-between items-center">
                                <div className="text-xs text-text-dark/50 font-mono">
                                    ID: {exam.id}
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-text-dark/60 hover:text-accent-earthy hover:bg-white rounded-lg transition-colors" title="View Details">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <Link href={`/dashboard/manajemen-ujian/edit/${exam.id}`} className="p-2 text-text-dark/60 hover:text-blue-600 hover:bg-white rounded-lg transition-colors" title="Edit">
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                    <DeleteExamButton id={exam.id} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-white p-12 rounded-xl text-center border border-neutral-warm/20">
                        <p className="text-text-dark/50 italic">No exams found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
