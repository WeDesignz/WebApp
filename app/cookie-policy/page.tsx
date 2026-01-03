import { Metadata } from 'next';
import Link from 'next/link';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn about how WeDesignz uses cookies on our website. Understand cookie types, purposes, and how to manage your cookie preferences.',
  keywords: ['cookie policy', 'cookies', 'wedesignz cookies', 'cookie management'],
  alternates: {
    canonical: `${siteUrl}/cookie-policy`,
  },
  openGraph: {
    title: 'Cookie Policy - WeDesignz',
    description: 'Learn about how WeDesignz uses cookies on our website',
    url: `${siteUrl}/cookie-policy`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
            <p className="text-foreground/80 leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
              They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              WeDesignz uses cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/80 ml-4">
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly and cannot be switched off.</li>
              <li><strong>Authentication:</strong> To keep you logged in and maintain your session.</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences.</li>
              <li><strong>Analytics:</strong> To understand how visitors interact with our website and improve user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-foreground/80 leading-relaxed">
              You can control and manage cookies in your browser settings. However, please note that disabling certain cookies 
              may affect the functionality of our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
            <p className="text-foreground/80 leading-relaxed">
              Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. 
              Please refer to the respective privacy policies of these third parties for more information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-foreground/80 leading-relaxed">
              If you have any questions about our use of cookies, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

