import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsBySlug, incrementNewsView } from "@/app/actions/news";
import PublicNewsDetail from "@/components/public/PublicNewsDetail";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const article = await getNewsBySlug(slug);
    if (!article) return { title: "Artikel tidak ditemukan" };
    return {
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.summary || undefined,
    };
}

export default async function PublicNewsDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const article = await getNewsBySlug(slug);
    if (!article) notFound();

    await incrementNewsView(article.id);

    return (
        <PublicNewsDetail
            title={article.title}
            category={article.category}
            publishedAt={article.publishedAt}
            thumbnailUrl={article.thumbnailUrl}
            content={article.content}
        />
    );
}
