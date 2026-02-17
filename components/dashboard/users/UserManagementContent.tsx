"use client";

import { useState, useTransition } from "react";
import { getAllUsers } from "@/app/actions/users";
import { Filter, Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import UserTable from "./UserTable";
import AddUserModal from "./AddUserModal";

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "pembina" | "peserta";
    school: string | null;
    contact: string | null;
    competitionCategory: string | null;
    createdAt: Date | null;
}

interface UsersResult {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface UserManagementContentProps {
    initialUsers: UsersResult;
    schools: string[];
}

export default function UserManagementContent({ initialUsers, schools }: UserManagementContentProps) {
    const [users, setUsers] = useState(initialUsers);
    const [isPending, startTransition] = useTransition();

    // Filter states
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [selectedSchool, setSelectedSchool] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);

    const handleFilterChange = () => {
        startTransition(async () => {
            const filters: any = { page: 1, limit: 20 };

            if (selectedRole) filters.role = selectedRole;
            if (selectedSchool) filters.school = selectedSchool;
            if (searchQuery) filters.search = searchQuery;

            const result = await getAllUsers(filters);
            setUsers(result);
            setCurrentPage(1);
        });
    };

    const handlePageChange = (newPage: number) => {
        startTransition(async () => {
            const filters: any = { page: newPage, limit: 20 };

            if (selectedRole) filters.role = selectedRole;
            if (selectedSchool) filters.school = selectedSchool;
            if (searchQuery) filters.search = searchQuery;

            const result = await getAllUsers(filters);
            setUsers(result);
            setCurrentPage(newPage);
        });
    };

    const handleClearFilters = () => {
        setSelectedRole("");
        setSelectedSchool("");
        setSearchQuery("");
        startTransition(async () => {
            const result = await getAllUsers({ page: 1, limit: 20 });
            setUsers(result);
            setCurrentPage(1);
        });
    };

    const handleUserAdded = () => {
        setShowAddModal(false);
        // Refresh data
        startTransition(async () => {
            const filters: any = { page: currentPage, limit: 20 };
            if (selectedRole) filters.role = selectedRole;
            if (selectedSchool) filters.school = selectedSchool;
            if (searchQuery) filters.search = searchQuery;

            const result = await getAllUsers(filters);
            setUsers(result);
        });
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 space-y-6">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-dark font-semibold">
                        <Filter className="w-5 h-5" />
                        <span>Filters</span>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-earthy text-white rounded-lg hover:bg-accent-earthy/90 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add User
                    </button>
                </div>

                {/* Filters Section */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-medium text-text-dark/70 mb-2">Role</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="pembina">Pembina</option>
                                <option value="peserta">Peserta</option>
                            </select>
                        </div>

                        {/* School Filter */}
                        <div>
                            <label className="block text-sm font-medium text-text-dark/70 mb-2">School</label>
                            <select
                                value={selectedSchool}
                                onChange={(e) => setSelectedSchool(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-warm/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-earthy"
                            >
                                <option value="">All Schools</option>
                                {schools.map((school) => (
                                    <option key={school} value={school}>
                                        {school}
                                    </option>
                                ))}
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
                                    placeholder="Name or email..."
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

                {/* User Table */}
                <UserTable users={users.data} onUserUpdated={handleUserAdded} />

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-warm/20">
                    <p className="text-sm text-text-dark/60">
                        {users.total > 0 ? (
                            <>
                                Showing {(currentPage - 1) * users.limit + 1} to{" "}
                                {Math.min(currentPage * users.limit, users.total)} of {users.total} users
                            </>
                        ) : (
                            "No users found"
                        )}
                    </p>
                    {users.totalPages > 1 && (
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
                                {Array.from({ length: Math.min(5, users.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (users.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= users.totalPages - 2) {
                                        pageNum = users.totalPages - 4 + i;
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
                                disabled={currentPage === users.totalPages || isPending}
                                className="px-3 py-2 border border-neutral-warm/30 rounded-lg hover:bg-neutral-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                                <span className="text-sm">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onUserAdded={handleUserAdded}
                />
            )}
        </>
    );
}
