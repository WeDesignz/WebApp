import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy - WeDesignz',
  description: 'Shipping and Delivery Policy for WeDesignz platform',
};

export default function ShippingPage() {
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
          <h1 className="text-4xl font-bold mb-2">Shipping & Delivery Policy</h1>
          <p className="text-muted-foreground">Last Updated: {currentDate}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-foreground/80">
              At <strong>WeDesignz</strong>, we primarily deal with digital products and services. 
              This policy outlines our delivery timelines and procedures for all our products and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Delivery Timeline</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Digital Products</h3>
                <p className="text-foreground/80">
                  Digital products (design files, templates, graphics) are delivered instantly to your 
                  registered email ID and are also available in your account dashboard immediately 
                  after purchase. You will receive:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-2">
                  <li>Instant access to downloadable files</li>
                  <li>Email confirmation with download links</li>
                  <li>Access through your customer dashboard</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Custom Design Orders</h3>
                <p className="text-foreground/80">
                  Custom design orders are delivered according to the timeline specified at the time of 
                  order placement. Typical delivery times:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-2">
                  <li>Standard custom orders: 3-7 business days</li>
                  <li>Rush orders: 1-3 business days (if available)</li>
                  <li>Complex projects: As per agreed timeline (usually 7-14 business days)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Physical Products (if applicable)</h3>
                <p className="text-foreground/80">
                  If we offer physical products, delivery within India typically takes 3-7 business 
                  days after dispatch. International shipping may take 7-15 business days depending 
                  on the destination.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Shipping Charges</h2>
            <p className="text-foreground/80">
              Shipping charges, if applicable for physical products, will be clearly shown at checkout. 
              Digital products have no shipping charges. For custom orders, any additional delivery 
              charges will be communicated before order confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Order Tracking</h2>
            <p className="text-foreground/80 mb-4">
              For digital products:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>You will receive email confirmation immediately after purchase</li>
              <li>Download links are available in your account dashboard</li>
              <li>Order status can be tracked through your customer dashboard</li>
            </ul>
            <p className="text-foreground/80 mt-4">
              For physical products (if applicable):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li>Tracking details will be sent via email/SMS after dispatch</li>
              <li>You can track your order through the provided tracking number</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Delivery Methods</h2>
            <p className="text-foreground/80 mb-4">We deliver products through:</p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Email Delivery:</strong> For digital products, files are sent to your registered email</li>
              <li><strong>Account Dashboard:</strong> All purchased digital products are available in your account</li>
              <li><strong>Cloud Storage Links:</strong> For large files, secure download links are provided</li>
              <li><strong>Physical Shipping:</strong> For physical products, we use reliable courier services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Failed Delivery</h2>
            <p className="text-foreground/80 mb-4">
              If delivery fails due to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80">
              <li><strong>Incorrect Email Address:</strong> Please ensure your email is correct. Contact support to update your email.</li>
              <li><strong>Email Delivery Issues:</strong> Check your spam folder. If not received within 24 hours, contact support.</li>
              <li><strong>Incorrect Address (Physical Products):</strong> Users may be charged re-delivery fees for incorrect addresses.</li>
              <li><strong>Unavailability:</strong> For physical products, if recipient is unavailable, re-delivery may incur additional charges.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Delivery Confirmation</h2>
            <p className="text-foreground/80">
              For digital products, delivery is considered complete when:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mt-4">
              <li>Email with download links has been sent to your registered email</li>
              <li>Files are available in your account dashboard</li>
              <li>You have successfully downloaded the files</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
            <p className="text-foreground/80 mb-2">
              For questions about delivery or shipping, please contact us:
            </p>
            <div className="space-y-1 text-foreground/80">
              <p><strong>Email:</strong> delivery@wedesignz.com</p>
              <p><strong>Phone:</strong> +91-XXXXXXXXXX</p>
              <p><strong>Support Hours:</strong> Monday - Saturday, 10 AM - 6 PM IST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

