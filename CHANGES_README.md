# Changes Made

1.  **Sidebar Links**: Updated the "Latihan & Jadwal" link for **Admin** and **Pembina** to point to `/dashboard/manajemen-ujian`.
2.  **Peserta Dashboard**: Updated to display real data.
    -   "Last Practice" card shows actual latest score.
    -   "Exam History Table" fetches recent exam sessions from the database.
3.  **Fix**: Added missing `getExamHistory` function to `app/actions/exams.ts` to resolve export error.
