"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', score: 40 },
    { name: 'Tue', score: 60 },
    { name: 'Wed', score: 75 },
    { name: 'Thu', score: 50 },
    { name: 'Fri', score: 85 },
    { name: 'Sat', score: 90 },
    { name: 'Sun', score: 65 },
];

export default function WeeklyProgressChart() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-warm/20 h-[300px]">
            <h3 className="text-lg font-bold text-text-dark mb-4">Weekly Learning Progress</h3>
            <div className="h-full w-full pb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E0E1" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#493628', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#493628', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#E4E0E1', opacity: 0.4 }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="score" fill="#AB886D" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
