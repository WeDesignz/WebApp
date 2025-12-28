import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - WeDesignz',
  description: 'Read the latest articles, tips, and insights from WeDesignz',
};

export default function BlogPage() {
  return (
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
  );
}

