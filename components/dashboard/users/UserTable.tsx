"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import EditUserModal from "./EditUserModal";
import DeleteUserDialog from "./DeleteUserDialog";

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

interface UserTableProps {
    users: User[];
    onUserUpdated: () => void;
}

export default function UserTable({ users, onUserUpdated }: UserTableProps) {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-red-100 text-red-700";
            case "pembina":
                return "bg-purple-100 text-purple-700";
            case "peserta":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-warm/20">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                School
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-text-dark/60 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-warm/20">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-light/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-text-dark">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-text-dark/70">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-block px-2 py-1 text-xs font-semibold rounded uppercase ${getRoleBadgeClass(
                                                user.role
                                            )}`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-text-dark/70">{user.school || "-"}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-text-dark/70">{user.contact || "-"}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit user"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeletingUser(user)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-dark/50 italic">
                                    No users found. Try adjusting your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUserUpdated={() => {
                        setEditingUser(null);
                        onUserUpdated();
                    }}
                />
            )}

            {/* Delete Dialog */}
            {deletingUser && (
                <DeleteUserDialog
                    user={deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onUserDeleted={() => {
                        setDeletingUser(null);
                        onUserUpdated();
                    }}
                />
            )}
        </>
    );
}
