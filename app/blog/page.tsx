import { Metadata } from 'next';
import Link from 'next/link';
import PublicPageWrapper from '@/components/common/PublicPageWrapper';
import { BreadcrumbSchema } from '@/components/SEO/StructuredData';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest articles, design tips, creative insights, and industry trends from WeDesignz. Stay updated with design inspiration and best practices.',
  keywords: ['design blog', 'design tips', 'creative articles', 'design inspiration', 'graphic design blog'],
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'Blog - WeDesignz',
    description: 'Read the latest articles, design tips, and creative insights from WeDesignz',
    url: `${siteUrl}/blog`,
    type: 'website',
    images: [
      {
        url: '/Logos/WD LOGO2048BLACK.png',
        width: 1200,
        height: 630,
        alt: 'WeDesignz Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - WeDesignz',
    description: 'Read the latest articles, tips, and insights from WeDesignz',
  },
};

export default function BlogPage() {
  return (
    <PublicPageWrapper>
      <BreadcrumbSchema items={[{ name: 'Home', url: siteUrl }, { name: 'Blog', url: `${siteUrl}/blog` }]} />
      <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest design trends, tips, and insights from our community.
          </p>
        </div>

        <div className="space-y-8">
          <div className="p-8 border border-border rounded-lg text-center">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-foreground/80 mb-6">
              We&apos;re working on bringing you amazing content about design, creativity, and the WeDesignz community. 
              Check back soon for articles, tutorials, and inspiration!
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
    </PublicPageWrapper>
  );
}

