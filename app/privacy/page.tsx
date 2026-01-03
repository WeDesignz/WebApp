import { Metadata } from 'next';
import Link from 'next/link';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Privacy Policy for WeDesignz platform. Learn how we collect, use, and protect your personal information and data.',
  keywords: ['privacy policy', 'data protection', 'privacy', 'wedesignz privacy'],
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy - WeDesignz',
    description: 'Read the Privacy Policy for WeDesignz platform',
    url: `${siteUrl}/privacy`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: {currentDate}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-foreground/80">
              At <strong>WeDesignz</strong>, accessible at our website, we are committed to protecting 
              your personal information and respecting your privacy. This Privacy Policy explains how 
              we collect, use, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-foreground/80 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Name:</strong> Your full name for account and order processing</li>
              <li><strong>Email:</strong> Your email address for account communication and order updates</li>
              <li><strong>Phone:</strong> Your phone number for account verification and support</li>
              <li><strong>Billing Information:</strong> Payment details processed securely through Razorpay</li>
              <li><strong>Usage Data:</strong> Cookies, analytics data, and website interaction information</li>
              <li><strong>Profile Information:</strong> For designers, we collect business details, portfolio information, and verification documents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-foreground/80 mb-4">We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>To process payments and manage your orders</li>
              <li>To provide customer support and respond to inquiries</li>
              <li>To improve our services and user experience</li>
              <li>To send updates, notifications, and marketing communications (with your consent)</li>
              <li>To verify designer accounts and process onboarding</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Payment Information</h2>
            <p className="text-foreground/80">
              We use Razorpay for payment processing. Razorpay may collect and process your payment data 
              securely according to their privacy policy and PCI-DSS compliance standards. We do not store 
              your full card or bank details on our servers. All payment information is encrypted and 
              handled by Razorpay&apos;s secure payment gateway.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cookies</h2>
            <p className="text-foreground/80">
              We use cookies to enhance user experience and analyze website traffic. Cookies help us 
              remember your preferences, maintain your session, and provide personalized content. You 
              can control cookie settings through your browser preferences, though this may affect 
              some website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Protection</h2>
            <p className="text-foreground/80">
              We follow industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
              <li>SSL encryption for data transmission</li>
              <li>Secure server infrastructure</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Data backup and recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Sharing of Information</h2>
            <p className="text-foreground/80 mb-4">
              We do not sell or rent your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Payment Gateway (Razorpay):</strong> For processing payments</li>
              <li><strong>Service Providers:</strong> Hosting, analytics, and email service providers</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Partners:</strong> With your explicit consent for specific services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-foreground/80 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p className="text-foreground/80 mt-4">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-foreground/80 mb-2">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="space-y-1 text-foreground/80">
              <p><strong>Email:</strong> wedesignz006@gmail.com</p>
              <p><strong>Phone:</strong> +91-8000452183</p>
              <p><strong>Address:</strong> Sheetal Fab, B-117, Akar Tower, B-block, Old RTO road, Yogi Tower, Bhilwara - 311001</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

