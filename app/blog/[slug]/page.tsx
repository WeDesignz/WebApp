import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PublicPageWrapper from '@/components/common/PublicPageWrapper';
import { BreadcrumbSchema, ArticleSchema } from '@/components/SEO/StructuredData';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

/**
 * Stub: returns null until blog posts exist (CMS or static).
 * When adding content: implement to return post by slug with headline, description, url, image, datePublished, dateModified, author.
 */
async function getPost(_slug: string): Promise<{
  headline: string;
  description: string;
  slug: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  content?: string;
} | null> {
  return null;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: 'Post not found' };
  }
  return {
    title: post.headline,
    description: post.description,
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.headline} | WeDesignz Blog`,
      description: post.description,
      url: `${siteUrl}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      images: post.image ? [{ url: post.image, width: 1200, height: 630, alt: post.headline }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.headline} | WeDesignz Blog`,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <PublicPageWrapper>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'Blog', url: `${siteUrl}/blog` },
          { name: post.headline, url: `${siteUrl}/blog/${post.slug}` },
        ]}
      />
      <ArticleSchema
        post={{
          headline: post.headline,
          description: post.description,
          url: `${siteUrl}/blog/${post.slug}`,
          image: post.image,
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          author: post.author,
        }}
        siteUrl={siteUrl}
      />
      <article className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
          <Link href="/blog" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Blog
          </Link>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{post.headline}</h1>
            <p className="text-muted-foreground">
              {post.datePublished}
              {post.author && ` · ${post.author}`}
            </p>
          </header>
          {post.content ? (
            <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <p className="text-foreground/80">Content for this post is not yet available.</p>
          )}
        </div>
      </article>
    </PublicPageWrapper>
  );
}
