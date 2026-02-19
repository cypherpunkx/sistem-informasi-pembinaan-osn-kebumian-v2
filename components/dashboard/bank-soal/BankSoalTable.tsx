"use client";

import { useRouter, useSearchParams } from "next/navigation";
import DataTable from "@/components/ui/DataTable";

interface BankSoalTableProps<T extends { id: string | number }> {
    data: T[];
    columns: { header: string; accessorKey: keyof T }[];
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
}

export default function BankSoalTable<T extends { id: string | number }>({
    data,
    columns,
    currentPage,
    totalPages,
    total,
    limit,
}: BankSoalTableProps<T>) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(newPage));
        router.push(`/dashboard/bank-soal?${params.toString()}`);
    };

    return (
        <DataTable
            data={data}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
        />
    );
}
