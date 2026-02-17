import React from 'react';

interface StatusBadgeProps {
    status: string | null;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    if (!status) return null;

    const statusUpper = status.toUpperCase();

    let colorClass = "bg-gray-100 text-gray-800";

    switch (statusUpper) {
        case "PUBLISHED":
            colorClass = "bg-green-100 text-green-800";
            break;
        case "PENDING":
            colorClass = "bg-yellow-100 text-yellow-800";
            break;
        case "DRAFT":
            colorClass = "bg-gray-100 text-gray-800";
            break;
        case "ARCHIVED":
            colorClass = "bg-red-100 text-red-800";
            break;
        default:
            colorClass = "bg-gray-100 text-gray-800";
    }

    return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {statusUpper}
        </span>
    );
}
