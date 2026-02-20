import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { getNewsCategoryLabel } from "@/lib/news-categories";
import ShareButton from "./ShareButton";

interface PublicNewsDetailProps {
  title: string;
  category: string | null;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  content: string | null;
}

export default function PublicNewsDetail({
  title,
  category,
  publishedAt,
  thumbnailUrl,
  content,
}: PublicNewsDetailProps) {
  const safeContent = content ? sanitizeHtml(content) : "";

  return (
    <div className="bg-white min-h-screen">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {category && (
          <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-accent-earthy/15 text-accent-earthy mb-3">
            {getNewsCategoryLabel(category)}
          </span>
        )}
        <h1 className="text-3xl font-bold text-text-dark mb-3">{title}</h1>
        <p className="text-sm text-text-dark/60 mb-6">
          {publishedAt
            ? new Date(publishedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : ""}
        </p>

        {thumbnailUrl && (
          <div className="rounded-xl overflow-hidden mb-8 aspect-video bg-neutral-warm/10">
            <img
              src={thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div
          className="news-content max-w-[720px] mx-auto text-text-dark leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        <div className="max-w-[720px] mx-auto mt-10 flex flex-wrap gap-3">
          <ShareButton title={title} />
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-warm/30 text-sm font-medium text-text-dark hover:bg-neutral-light hover:border-accent-earthy/30"
          >
            ← Kembali ke News
          </Link>
        </div>
      </article>
    </div>
  );
}
