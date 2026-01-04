import { Metadata } from 'next';
import Link from 'next/link';
import PublicPageWrapper from '@/components/common/PublicPageWrapper';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Read the Refund and Cancellation Policy for WeDesignz platform. Understand our refund process, cancellation terms, and money-back guarantee.',
  keywords: ['refund policy', 'cancellation policy', 'wedesignz refund', 'money back guarantee'],
  alternates: {
    canonical: `${siteUrl}/refund`,
  },
  openGraph: {
    title: 'Refund & Cancellation Policy - WeDesignz',
    description: 'Read the Refund and Cancellation Policy for WeDesignz platform',
    url: `${siteUrl}/refund`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RefundPage() {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <PublicPageWrapper>
      <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground">Last Updated: {currentDate}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Refund Policy</h2>
            <p className="text-foreground/80 mb-4">
              We offer refunds under the following conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>If the service/product was not delivered as promised</li>
              <li>If there was a payment error or technical issue</li>
              <li>If duplicate payment occurred due to system error</li>
              <li>If the product received is significantly different from what was described</li>
              <li>If the order was cancelled before processing begins</li>
            </ul>
            <p className="text-foreground/80 mt-4">
              Refunds will be processed to the original payment method within 7–10 business days 
              after approval. The refund amount will exclude any transaction fees charged by the 
              payment gateway, which are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Cancellation Policy</h2>
            <p className="text-foreground/80 mb-4">
              Users may cancel orders/services under the following conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Cart Orders:</strong> Can be cancelled within 24 hours of purchase if not yet processed</li>
              <li><strong>Subscription Plans:</strong> Can be cancelled at any time, with access continuing until the end of the current billing period</li>
              <li><strong>Custom Orders:</strong> Can be cancelled within 48 hours of order placement if work has not begun</li>
            </ul>
            <p className="text-foreground/80 mt-4">
              To cancel an order, please contact us through our support system or email. Cancellation 
              requests must include your order number and reason for cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. No Refund Situations</h2>
            <p className="text-foreground/80 mb-4">
              Refunds will not be provided when:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Service has already been rendered or completed</li>
              <li>Digital products have been downloaded, accessed, or used</li>
              <li>User violates our Terms & Conditions</li>
              <li>Refund request is made after the cancellation period has expired</li>
              <li>Order was placed more than 30 days ago</li>
              <li>User has already received a refund for the same order</li>
              <li>Refund is requested due to change of mind after product delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Partial Refunds</h2>
            <p className="text-foreground/80">
              In some cases, we may offer partial refunds:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
              <li>If only part of the service was delivered</li>
              <li>If there are minor issues that don&apos;t warrant a full refund</li>
              <li>If the customer and WeDesignz agree to a partial refund as resolution</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Refund Process</h2>
            <p className="text-foreground/80 mb-4">
              To request a refund:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/80">
              <li>Contact our support team via email or through the support system</li>
              <li>Provide your order number and reason for refund</li>
              <li>Our team will review your request within 2-3 business days</li>
              <li>If approved, the refund will be processed within 7-10 business days</li>
              <li>You will receive confirmation once the refund is processed</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contact for Refund</h2>
            <p className="text-foreground/80 mb-2">
              For refund requests or questions about our refund policy, please contact us:
            </p>
            <div className="space-y-1 text-foreground/80">
              <p><strong>Support Email:</strong> <a href="mailto:support@wedesignz.com" className="text-primary hover:underline">support@wedesignz.com</a></p>
              <p><strong>General Inquiries:</strong> <a href="mailto:info@wedesignz.com" className="text-primary hover:underline">info@wedesignz.com</a></p>
              <p><strong>Phone:</strong> <a href="tel:8000452183" className="text-primary hover:underline">8000452183</a></p>
              <p><strong>Support Hours:</strong> Monday - Saturday, 10 AM - 6 PM IST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
    </PublicPageWrapper>
  );
}

