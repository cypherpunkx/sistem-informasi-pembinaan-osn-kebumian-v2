'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import FilterBar, { SELECT_CLASS } from '@/components/dashboard/FilterBar';

const BASE_PATH = '/dashboard/news';

export default function NewsFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (value && value !== 'All' && value !== 'all') params.set(key, value);
    else params.delete(key);
    replace(`${BASE_PATH}?${params.toString()}`);
  };

  const handleClear = () => replace(BASE_PATH);

  return (
    <FilterBar
      basePath={BASE_PATH}
      searchPlaceholder="Cari judul..."
      onReset={handleClear}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-dark/80">Status</label>
        <select
          className={SELECT_CLASS}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          value={searchParams.get('status') ?? 'All'}
        >
          <option value="All">Semua</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
        </select>
      </div>
    </FilterBar>
  );
}
