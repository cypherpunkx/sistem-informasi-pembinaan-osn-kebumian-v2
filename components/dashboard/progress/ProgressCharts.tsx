"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from "recharts";

interface ProgressChartsProps {
    categoryData: { category: string | null; avgScore: number }[];
    weeklyData: { date: string; count: number }[];
}

export default function ProgressCharts({ categoryData, weeklyData }: ProgressChartsProps) {
    // Fill in missing days for weekly data if needed, simplified for now
    const formattedWeeklyData = weeklyData.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Average Score by Category</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgScore" fill="#8884d8" name="Avg Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20">
                <h3 className="text-lg font-bold text-text-dark mb-4">Weekly Activity (Exams)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedWeeklyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Exams Completed" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
