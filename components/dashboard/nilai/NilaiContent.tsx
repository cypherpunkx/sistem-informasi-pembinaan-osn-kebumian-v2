"use client";

import { useState, useTransition } from "react";
import { getStudentExamSessions } from "@/app/actions/nilai";
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";
import ExamSessionRow from "./ExamSessionRow";

interface Student {
    id: number;
    name: string | null;
    email: string;
}

interface Exam {
    id: number;
    title: string;
    category: string | null;
}

interface SessionData {
    sessionId: number;
    userId: string;
    examId: number;
    score: number | null;
    endTime: Date | null;
    feedback: string | null;
    totalQuestions: number | null;
    correctAnswers: number | null;
    studentName: string | null;
    studentEmail: string | null;
    examTitle: string | null;
    examCategory: string | null;
}

interface SessionsResult {
    data: SessionData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface NilaiContentProps {
    initialSessions: SessionsResult;
    students: Student[];
    examsList: Exam[];
}

export default function NilaiContent({ initialSessions, students, examsList }: NilaiContentProps) {
    const [sessions, setSessions] = useState(initialSessions);
    const [isPending, startTransition] = useTransition();

    // Filter states
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    const [selectedExam, setSelectedExam] = useState<string>("");
    const [feedbackFilter, setFeedbackFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const handleFilterChange = () => {
        startTransition(async () => {
            const filters: any = { page: 1, limit: 20 };

            if (selectedStudent) filters.studentId = parseInt(selectedStudent);
            if (selectedExam) filters.examId = parseInt(selectedExam);
            if (feedbackFilter === "with") filters.hasFeedback = true;
            if (feedbackFilter === "without") filters.hasFeedback = false;

            const result = await getStudentExamSessions(filters);
            setSessions(result);
            setCurrentPage(1);
        });
    };

    const handlePageChange = (newPage: number) => {
        startTransition(async () => {
            const filters: any = { page: newPage, limit: 20 };

            if (selectedStudent) filters.studentId = parseInt(selectedStudent);
            if (selectedExam) filters.examId = parseInt(selectedExam);
            if (feedbackFilter === "with") filters.hasFeedback = true;
            if (feedbackFilter === "without") filters.hasFeedback = false;

            const result = await getStudentExamSessions(filters);
            setSessions(result);
            setCurrentPage(newPage);
        });
    };

    const handleClearFilters = () => {
        setSelectedStudent("");
        setSelectedExam("");
        setFeedbackFilter("all");
        setSearchQuery("");
        startTransition(async () => {
            const result = await getStudentExamSessions({ page: 1, limit: 20 });
            setSessions(result);
            setCurrentPage(1);
        });
    };

    // Client-side search filtering
    const filteredSessions = sessions.data.filter((session) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            session.studentName?.toLowerCase().includes(query) ||
            session.studentEmail?.toLowerCase().includes(query) ||
            session.examTitle?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-6">
            {/* Filters Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-dark font-semibold">
                    <Filter className="w-5 h-5" />
                    <span>Filters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Student Filter */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => {
                                setSelectedStudent(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                        >
                            <option value="">All Students</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.name || student.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Exam Filter */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">Exam</label>
                        <select
                            value={selectedExam}
                            onChange={(e) => {
                                setSelectedExam(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                        >
                            <option value="">All Exams</option>
                            {examsList.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Feedback Filter */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">Feedback Status</label>
                        <select
                            value={feedbackFilter}
                            onChange={(e) => {
                                setFeedbackFilter(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                        >
                            <option value="all">All</option>
                            <option value="with">With Feedback</option>
                            <option value="without">Without Feedback</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-text-dark/70 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dark/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Student or exam..."
                                className="w-full pl-10 pr-3 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleFilterChange}
                        disabled={isPending}
                        className="px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? "Loading..." : "Apply Filters"}
                    </button>
                    <button
                        onClick={handleClearFilters}
                        disabled={isPending}
                        className="px-4 py-2 border border-neutral-warm/30 text-text-dark rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Exam
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Score
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Feedback
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-warm/20">
                        {filteredSessions.length > 0 ? (
                            filteredSessions.map((session) => (
                                <ExamSessionRow key={session.sessionId} session={session} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-dark/50 italic">
                                    No exam sessions found. Try adjusting your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-warm/20">
                <p className="text-sm text-text-dark/60">
                    {sessions.total > 0 ? (
                        <>
                            Showing {(currentPage - 1) * sessions.limit + 1} to{" "}
                            {Math.min(currentPage * sessions.limit, sessions.total)} of {sessions.total} results
                        </>
                    ) : (
                        "No results"
                    )}
                </p>
                {sessions.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || isPending}
                            className="px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-sm">Previous</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, sessions.totalPages) }, (_, i) => {
                                let pageNum;
                                if (sessions.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= sessions.totalPages - 2) {
                                    pageNum = sessions.totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={isPending}
                                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${currentPage === pageNum
                                                ? "bg-accent-earthy text-white font-semibold"
                                                : "border border-neutral-warm/30 hover:bg-neutral-light/50 text-text-dark"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === sessions.totalPages || isPending}
                            className="px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                            <span className="text-sm">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
