'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterBar, { SELECT_CLASS } from '@/components/dashboard/FilterBar';
import { getTopics } from '@/app/actions/topics';

const BASE_PATH = '/dashboard/bank-soal';

export default function QuestionFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    getTopics().then((t) => setTopics(t.map((x) => x.name)));
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    if (value && value !== 'All') params.set(key, value);
    else params.delete(key);
    replace(`${BASE_PATH}?${params.toString()}`);
  };

  const handleLimitChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    params.set('limit', value);
    replace(`${BASE_PATH}?${params.toString()}`);
  };

  const handleClear = () => replace(BASE_PATH);

  return (
    <FilterBar
      basePath={BASE_PATH}
      searchPlaceholder="Cari soal..."
      onReset={handleClear}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-dark/80">Topik</label>
        <select
          className={SELECT_CLASS}
          onChange={(e) => handleFilterChange('topic', e.target.value)}
          value={searchParams.get('topic') ?? 'All'}
        >
          <option value="All">Semua Topik</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-dark/80">Tipe</label>
        <select
          className={SELECT_CLASS}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          value={searchParams.get('type') ?? 'All'}
        >
          <option value="All">Semua Tipe</option>
          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          <option value="SHORT_ANSWER">Short Answer</option>
          <option value="ESSAY">Essay</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-dark/80">Status</label>
        <select
          className={SELECT_CLASS}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          value={searchParams.get('status') ?? 'All'}
        >
          <option value="All">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-dark/80">
          Tingkat Kesulitan
        </label>
        <select
          className={SELECT_CLASS}
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          value={searchParams.get('difficulty') ?? 'All'}
        >
          <option value="All">Semua Tingkat</option>
          <option value="EASY">Mudah</option>
          <option value="MEDIUM">Sedang</option>
          <option value="HARD">Sulit</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-dark/80">
          Per halaman
        </label>
        <select
          className={SELECT_CLASS}
          onChange={(e) => handleLimitChange(e.target.value)}
          value={searchParams.get('limit') ?? '10'}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </FilterBar>
  );
}
