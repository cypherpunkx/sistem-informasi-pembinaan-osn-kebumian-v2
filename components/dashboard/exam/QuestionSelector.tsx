'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, PlusCircle } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { getQuestions } from '@/app/actions/questions';

interface QuestionSelectorProps {
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
}

export default function QuestionSelector({
  selectedIds,
  onSelectionChange,
}: QuestionSelectorProps) {
  const [questions, setQuestions] = useState<
    {
      id: number;
      content: string;
      topic: string;
      type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY';
    }[]
  >([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async (searchTerm: string) => {
    setLoading(true);
    const data = await getQuestions({ search: searchTerm });
    setQuestions(data);
    setLoading(false);
  };

  const debouncedFetch = useDebouncedCallback(fetchQuestions, 500);

  useEffect(() => {
    fetchQuestions('');
  }, []);

  const toggleSelection = (id: number) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];

    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4 border border-neutral-warm/20 rounded-xl p-4 bg-neutral-light/10">
      <h4 className="font-bold text-text-dark">Select Questions</h4>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/40 w-4 h-4" />
        <input
          type="text"
          placeholder="Search question content..."
          className="w-full pl-9 pr-4 py-2 border border-neutral-warm/30 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-earthy/20"
          onChange={(e) => {
            setSearch(e.target.value);
            debouncedFetch(e.target.value);
          }}
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {questions.map((q) => {
          const isSelected = selectedIds.includes(q.id);
          return (
            <div
              key={q.id}
              onClick={() => toggleSelection(q.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3
                                ${
                                  isSelected
                                    ? 'bg-accent-earthy/10 border-accent-earthy'
                                    : 'bg-white border-neutral-warm/20 hover:border-accent-earthy/50'
                                }`}
            >
              <div
                className={`mt-0.5 ${isSelected ? 'text-accent-earthy' : 'text-neutral-400'}`}
              >
                {isSelected ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-dark line-clamp-2">
                  {q.content}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 bg-neutral-warm/10 rounded text-text-dark/60">
                    {q.topic}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 bg-neutral-warm/10 rounded text-text-dark/60">
                    {q.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {questions.length === 0 && !loading && (
          <p className="text-center text-sm text-text-dark/50 py-4">
            No questions found.
          </p>
        )}
        {loading && (
          <p className="text-center text-sm text-text-dark/50 py-4">
            Loading...
          </p>
        )}
      </div>

      <div className="pt-2 text-sm text-right text-text-dark/60 font-medium">
        {selectedIds.length} questions selected
      </div>
    </div>
  );
}
