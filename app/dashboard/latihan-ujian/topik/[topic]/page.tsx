import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getQuestionCountByTopic } from '@/app/actions/topic-practice';
import TopicPracticeForm from './TopicPracticeForm';

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export default async function TopicPracticePage({ params }: TopicPageProps) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);

  if (!decodedTopic || decodedTopic.trim() === '') {
    redirect('/dashboard/latihan-ujian');
  }

  const questionCount = await getQuestionCountByTopic(decodedTopic);

  if (questionCount === 0) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Link
          href="/dashboard/latihan-ujian"
          className="inline-flex items-center gap-2 text-text-dark/60 hover:text-accent-earthy transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Latihan & Ujian
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 p-8 text-center">
          <h1 className="text-xl font-bold text-text-dark mb-2">
            Belum ada soal untuk topik ini
          </h1>
          <p className="text-text-dark/60 mb-6">
            Topik <strong>&quot;{decodedTopic}&quot;</strong> belum memiliki
            soal yang tersedia. Silakan cek materi pendukung atau pilih topik
            lain.
          </p>
          <Link
            href="/dashboard/materi"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-earthy text-white font-bold rounded-lg hover:bg-text-dark transition-colors"
          >
            <BookOpen className="w-5 h-5" /> Lihat Materi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/dashboard/latihan-ujian"
        className="inline-flex items-center gap-2 text-text-dark/60 hover:text-accent-earthy transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Latihan & Ujian
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-warm/20 p-8">
        <h1 className="text-xl font-bold text-text-dark mb-2">
          Latihan Topik: {decodedTopic}
        </h1>
        <p className="text-text-dark/60 mb-6">
          Tersedia {questionCount} soal untuk topik ini. Soal akan diacak dan
          maksimal 10 soal per sesi latihan.
        </p>

        <TopicPracticeForm topic={decodedTopic} questionCount={questionCount} />
      </div>
    </div>
  );
}
