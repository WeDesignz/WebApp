import { Metadata } from 'next';
import Link from 'next/link';
import PublicPageWrapper from '@/components/common/PublicPageWrapper';
import { BreadcrumbSchema, FAQPageSchema } from '@/components/SEO/StructuredData';
import { faqs } from './faqs';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about WeDesignz. Learn about purchasing designs, subscription plans, becoming a designer, refunds, and how to contact support.',
  keywords: [
    'wedesignz faq',
    'design marketplace faq',
    'purchase designs',
    'designer signup',
    'wedesignz support',
  ],
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    title: 'FAQ - WeDesignz',
    description:
      'Frequently asked questions about WeDesignz. Learn about purchasing designs, plans, becoming a designer, and support.',
    url: `${siteUrl}/faq`,
    type: 'website',
    images: [
      {
        url: '/Logos/WD LOGO2048BLACK.png',
        width: 1200,
        height: 630,
        alt: 'WeDesignz - FAQ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - WeDesignz',
    description: 'Frequently asked questions about WeDesignz',
    images: ['/Logos/WD LOGO2048BLACK.png'],
  },
};

export default function FAQPage() {
  return (
    <PublicPageWrapper>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: siteUrl },
          { name: 'FAQ', url: `${siteUrl}/faq` },
        ]}
      />
      <FAQPageSchema faqs={faqs} />
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
          <div className="mb-8">
            <Link
              href="/"
              className="text-primary hover:underline text-sm mb-4 inline-block"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">
              Find answers to common questions about purchasing designs, subscription
              plans, custom orders, and becoming a designer on WeDesignz.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="rounded-xl border border-border bg-card p-5"
              >
                <summary className="cursor-pointer select-none text-base font-medium">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm text-foreground/80">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-12 p-6 border border-border rounded-lg bg-muted/30">
            <p className="text-foreground/80">
              Still have questions? Visit our{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact page
              </Link>{' '}
              or email support@wedesignz.com.
            </p>
          </div>
        </div>
      </div>
    </PublicPageWrapper>
  );
}
