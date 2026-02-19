import { getExamResult } from '@/app/actions/exams';
import { CheckCircle, XCircle, ArrowLeft, Clock, Award } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const result = await getExamResult(parseInt(sessionId));

  if (!result.success || !result.session || !result.exam) {
    return notFound();
  }

  const { session, exam, results } = result;

  // Calculate stats
  const duration =
    session.endTime && session.startTime
      ? Math.round(
          (new Date(session.endTime!).getTime() -
            new Date(session.startTime!).getTime()) /
            60000,
        )
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header / Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-warm/20 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-accent-earthy to-green-600"></div>

        <h1 className="text-3xl font-bold text-text-dark mb-2">{exam.title}</h1>
        <p className="text-text-dark/60 mb-6">{exam.description}</p>

        <div className="flex justify-center items-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-accent-earthy mb-1">
              {session.score}
            </div>
            <div className="text-sm text-text-dark/60 uppercase tracking-wide font-medium">
              Score
            </div>
          </div>
          <div className="h-12 w-px bg-neutral-warm/30"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-dark mb-1 flex justify-center items-center gap-2">
              {session.correctAnswers}{' '}
              <span className="text-base font-normal text-text-dark/40">
                / {session.totalQuestions}
              </span>
            </div>
            <div className="text-sm text-text-dark/60 uppercase tracking-wide font-medium">
              Correct
            </div>
          </div>
          <div className="h-12 w-px bg-neutral-warm/30"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-dark mb-1 flex justify-center items-center gap-2">
              <Clock className="w-5 h-5 text-text-dark/40" /> {duration}m
            </div>
            <div className="text-sm text-text-dark/60 uppercase tracking-wide font-medium">
              Duration
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/latihan-ujian"
          className="inline-flex items-center gap-2 text-text-dark/60 hover:text-accent-earthy transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </Link>
      </div>

      {/* Questions Review */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text-dark border-l-4 border-accent-earthy pl-4">
          Detailed Review
        </h2>

        {results?.map((item, index) => {
          if (!item) return null;
          const isCorrect = item.isCorrect === true;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm border p-6 transition-all 
                            ${isCorrect ? 'border-green-200' : 'border-red-200'}`}
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex gap-4">
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                                        ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-lg font-medium text-text-dark pr-4 flex-1">
                          {item.content}
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm font-bold px-2 py-1 rounded border
                                                    ${
                                                      item.earnedScore ===
                                                      item.weight
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : item.earnedScore > 0
                                                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                          : 'bg-red-100 text-red-700 border-red-200'
                                                    }`}
                          >
                            {item.earnedScore} / {item.weight} pts
                          </span>
                        </div>
                      </div>

                      {/* Options Review */}
                      {item.type === 'MULTIPLE_CHOICE' && (
                        <div className="space-y-2">
                          {item.options && item.options.length > 0 ? (
                            item.options.map(
                              (
                                option: {
                                  id: number;
                                  content: string;
                                  isCorrect: boolean;
                                },
                                optIdx: number,
                              ) => {
                                const isSelected =
                                  item.userAnswer === option.id.toString();
                                const isActuallyCorrect =
                                  option.isCorrect === true;

                                let optionClass =
                                  'border-neutral-warm/20 bg-white';
                                let icon = null;

                                if (isSelected && isActuallyCorrect) {
                                  optionClass = 'border-green-500 bg-green-50';
                                  icon = (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  );
                                } else if (isSelected && !isActuallyCorrect) {
                                  optionClass = 'border-red-500 bg-red-50';
                                  icon = (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  );
                                } else if (isActuallyCorrect) {
                                  optionClass =
                                    'border-green-500 bg-green-50 border-dashed';
                                  icon = (
                                    <CheckCircle className="w-5 h-5 text-green-600 opacity-50" />
                                  );
                                }

                                return (
                                  <div
                                    key={option.id}
                                    className={`p-3 rounded-lg border flex items-center justify-between ${optionClass}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold
                                                                        ${isSelected || isActuallyCorrect ? 'border-transparent bg-black/5' : 'border-neutral-warm/40'}`}
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </div>
                                      <span className="text-text-dark">
                                        {option.content}
                                      </span>
                                    </div>
                                    {icon}
                                  </div>
                                );
                              },
                            )
                          ) : (
                            <p className="text-red-500 text-sm">
                              No options available for this question.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Short Answer Review */}
                      {item.type === 'SHORT_ANSWER' && (
                        <div className="space-y-3 mt-4">
                          <div>
                            <p className="text-xs font-bold text-text-dark/60 uppercase mb-1">
                              Your Answer
                            </p>
                            <div
                              className={`p-3 rounded-lg border text-sm font-mono
                                                        ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}
                            >
                              {item.userAnswer || '(No Answer)'}
                            </div>
                          </div>
                          {!isCorrect && (
                            <div>
                              <p className="text-xs font-bold text-text-dark/60 uppercase mb-1">
                                Accepted Answers
                              </p>
                              <div className="p-3 rounded-lg border border-neutral-warm/20 bg-white text-sm text-text-dark">
                                {Array.isArray(item.answerKeys)
                                  ? (item.answerKeys as { key: string; type?: string }[])
                                      .map((k) => `${k.key}${k.type ? ` (${k.type})` : ''}`)
                                      .join(', ')
                                  : 'No Key'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Essay Review */}
                      {item.type === 'ESSAY' && (
                        <div className="space-y-4 mt-4">
                          <div>
                            <p className="text-xs font-bold text-text-dark/60 uppercase mb-1">
                              Your Answer
                            </p>
                            <div className="p-4 rounded-lg border border-neutral-warm/30 bg-white text-text-dark whitespace-pre-wrap text-sm leading-relaxed">
                              {item.userAnswer || '(No Answer)'}
                            </div>
                          </div>

                          {item.feedback && (
                            <div className="bg-accent-earthy/5 p-4 rounded-lg border border-accent-earthy/10">
                              <p className="text-xs font-bold text-accent-earthy uppercase mb-2 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" /> Auto-Grading
                                Feedback
                              </p>
                              <pre className="text-xs text-text-dark/80 font-mono whitespace-pre-wrap">
                                {item.feedback}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation Accordion / Box */}
                <div className="mt-6 bg-neutral-light/50 rounded-lg p-4 border border-neutral-warm/10">
                  <h4 className="text-sm font-bold text-accent-earthy mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Explanation
                  </h4>
                  <p className="text-text-dark/80 text-sm leading-relaxed">
                    {item.explanation || 'No explanation provided.'}
                  </p>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
