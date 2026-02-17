"use client";

import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface Column<T> {
    header: string;
    accessorKey: keyof T;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
}: DataTableProps<T>) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead className="bg-neutral-light">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider ${col.className || ""}`}
                                >
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-text-dark">
                                        {col.header}
                                        {/* Placeholder for sort icon, logic to be added if needed */}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-warm/20">
                        {data.length > 0 ? (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-neutral-warm/5 transition-colors">
                                    {columns.map((col, idx) => (
                                        <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            {row[col.accessorKey] as React.ReactNode}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-10 text-center text-text-dark/50 italic">
                                    No data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {(totalPages > 1 || onPageChange) && (
                <div className="bg-white px-4 py-3 border-t border-neutral-warm/20 flex items-center justify-between sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => onPageChange?.(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="relative inline-flex items-center px-4 py-2 border border-neutral-warm/30 text-sm font-medium rounded-md text-text-dark bg-white hover:bg-neutral-light disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange?.(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-warm/30 text-sm font-medium rounded-md text-text-dark bg-white hover:bg-neutral-light disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-text-dark/70">
                                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => onPageChange?.(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-warm/30 bg-white text-sm font-medium text-text-dark/60 hover:bg-neutral-light disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                {/* Simplified Page Numbers */}
                                <span className="relative inline-flex items-center px-4 py-2 border border-neutral-warm/30 bg-white text-sm font-medium text-text-dark">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => onPageChange?.(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-warm/30 bg-white text-sm font-medium text-text-dark/60 hover:bg-neutral-light disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
