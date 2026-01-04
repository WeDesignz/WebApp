import { Metadata } from 'next';
import Link from 'next/link';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the Terms and Conditions for WeDesignz platform. Understand your rights and obligations when using our design marketplace services.',
  keywords: ['terms and conditions', 'wedesignz terms', 'user agreement', 'platform terms'],
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    title: 'Terms & Conditions - WeDesignz',
    description: 'Read the Terms and Conditions for WeDesignz platform',
    url: `${siteUrl}/terms`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last Updated: {currentDate}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-foreground/80">
              Welcome to <strong>WeDesignz</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;). 
              These Terms & Conditions govern your use of our website and our products/services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/80">
              By accessing or using our website, you agree to be bound by these Terms & Conditions. 
              If you do not agree with any part of these terms, you must not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
            <p className="text-foreground/80">
              You must be 18 years or older to use our services. By using our platform, you represent 
              and warrant that you are at least 18 years of age and have the legal capacity to enter 
              into these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Services</h2>
            <p className="text-foreground/80 mb-4">
              We provide a creative design marketplace platform that connects designers with customers. 
              Our services include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Design marketplace for purchasing and selling digital designs</li>
              <li>Custom design order services</li>
              <li>Subscription plans for access to premium designs</li>
              <li>Designer onboarding and profile management</li>
            </ul>
            <p className="text-foreground/80 mt-4">
              We reserve the right to modify or discontinue any service without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Payments</h2>
            <p className="text-foreground/80">
              Payments on our website are processed securely through Razorpay. By making a purchase, 
              you authorize Razorpay to process your payment. All transactions are subject to Razorpay&apos;s 
              terms and conditions. We are not responsible for any payment processing errors or issues 
              that may arise from the payment gateway.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Obligations</h2>
            <p className="text-foreground/80 mb-4">
              Users agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Misuse our platform or violate any applicable laws</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Upload malicious software, viruses, or harmful code</li>
              <li>Impersonate any person or entity</li>
              <li>Engage in fraudulent activities</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any local, state, national, or international law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-foreground/80">
              All content, logos, designs, text, and graphics on this website are the property of 
              WeDesignz or our content creators. Unauthorized use, reproduction, or distribution of 
              any content is strictly prohibited. Designers retain ownership of their uploaded designs, 
              but grant WeDesignz a license to display and sell their designs on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-foreground/80">
              We will not be responsible for any indirect, incidental, or consequential damages caused 
              by the use of our services. Our total liability for any claims arising from your use of 
              our services shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="text-foreground/80">
              We may update these Terms at any time. Continued use of the website after changes are 
              posted means you accept the updated terms. We will notify users of significant changes 
              via email or website notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
            <p className="text-foreground/80 mb-2">
              If you have any questions about these Terms & Conditions, please contact us:
            </p>
            <div className="space-y-1 text-foreground/80">
              <p><strong>Support Email:</strong> <a href="mailto:support@wedesignz.com" className="text-primary hover:underline">support@wedesignz.com</a></p>
              <p><strong>General Inquiries:</strong> <a href="mailto:info@wedesignz.com" className="text-primary hover:underline">info@wedesignz.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:8000452183" className="text-primary hover:underline">8000452183</a></p>
              <p><strong>Address:</strong> Sheetal Fab, B-117, Akar Tower, B-block, Old RTO road, Yogi Tower, Bhilwara - 311001</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

