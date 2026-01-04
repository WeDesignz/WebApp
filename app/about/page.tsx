import { Metadata } from 'next';
import Link from 'next/link';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about WeDesignz - The premier marketplace connecting talented designers with customers worldwide. Discover our mission, values, and commitment to quality design.',
  keywords: ['about wedesignz', 'design marketplace', 'company information', 'our mission'],
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'About Us - WeDesignz',
    description: 'Learn about WeDesignz - The premier marketplace connecting talented designers with customers worldwide',
    url: `${siteUrl}/about`,
    type: 'website',
    images: [
      {
        url: '/Logos/WD LOGO2048BLACK.png',
        width: 1200,
        height: 630,
        alt: 'WeDesignz - About Us',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - WeDesignz',
    description: 'Learn about WeDesignz - The premier marketplace connecting talented designers with customers worldwide',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">About WeDesignz</h1>
          <p className="text-muted-foreground">
            The premier marketplace connecting talented designers with customers worldwide.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-foreground/80 leading-relaxed">
              At WeDesignz, we believe that great design should be accessible to everyone. Our mission is to create a platform where talented designers can showcase their work, connect with customers, and build successful careers while making exceptional design accessible to businesses and individuals worldwide.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              WeDesignz is a comprehensive marketplace that offers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/80 ml-4">
              <li>A curated collection of high-quality designs across multiple categories</li>
              <li>Tools and resources for designers to manage their portfolios and earnings</li>
              <li>Secure transactions and reliable customer support</li>
              <li>Community features to connect designers and customers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Quality First</h3>
                <p className="text-foreground/80 leading-relaxed">
                  We maintain high standards for all designs on our platform, ensuring customers receive exceptional quality.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Supporting Creators</h3>
                <p className="text-foreground/80 leading-relaxed">
                  We provide designers with the tools, resources, and support they need to succeed and grow their careers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Customer Focus</h3>
                <p className="text-foreground/80 leading-relaxed">
                  We prioritize customer satisfaction and work continuously to improve the platform experience.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Have questions or want to learn more? We&apos;d love to hear from you. Reach out to us through any of the following channels:
            </p>
            <div className="space-y-3 text-foreground/80">
              <p>
                <strong>Support Email:</strong> <a href="mailto:support@wedesignz.com" className="text-primary hover:underline">support@wedesignz.com</a>
              </p>
              <p>
                <strong>General Inquiries:</strong> <a href="mailto:info@wedesignz.com" className="text-primary hover:underline">info@wedesignz.com</a>
              </p>
              <p>
                <strong>Phone:</strong> <a href="tel:8000452183" className="text-primary hover:underline">8000452183</a>
              </p>
              <p className="mt-4">
                For more details, visit our <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

