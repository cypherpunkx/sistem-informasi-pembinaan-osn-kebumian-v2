export default function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        DRAFT: "bg-gray-100 text-gray-800",
        PENDING: "bg-yellow-100 text-yellow-800",
        PUBLISHED: "bg-green-100 text-green-800",
        ARCHIVED: "bg-red-100 text-red-800",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}
