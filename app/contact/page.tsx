import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact WeDesignz for support, inquiries, and assistance. Reach us via email, phone, or visit our office in Bhilwara, Rajasthan. We respond within 24-48 hours.',
  keywords: ['contact wedesignz', 'customer support', 'get in touch', 'wedesignz contact'],
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: 'Contact Us - WeDesignz',
    description: 'Contact WeDesignz for support, inquiries, and assistance. Reach us via email, phone, or visit our office.',
    url: `${siteUrl}/contact`,
    type: 'website',
    images: [
      {
        url: '/Logos/WD LOGO2048BLACK.png',
        width: 1200,
        height: 630,
        alt: 'WeDesignz - Contact Us',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us - WeDesignz',
    description: 'Contact WeDesignz for support, inquiries, and assistance',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
          <p className="text-muted-foreground">
            We&apos;re here to help! Get in touch with us for any questions or support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Support Email</h3>
                  <p className="text-muted-foreground mb-2">For support and assistance</p>
                  <a 
                    href="mailto:support@wedesignz.com" 
                    className="text-primary hover:underline"
                  >
                    support@wedesignz.com
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">General Inquiries</h3>
                  <p className="text-muted-foreground mb-2">For general information</p>
                  <a 
                    href="mailto:info@wedesignz.com" 
                    className="text-primary hover:underline"
                  >
                    info@wedesignz.com
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-muted-foreground mb-2">Call us during business hours</p>
                  <a 
                    href="tel:+918000452183" 
                    className="text-primary hover:underline"
                  >
                    8000452183
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-muted-foreground">
                    Sheetal Fab
                    <br />
                    B-117, Akar Tower, B-block,
                    <br />
                    Old RTO road, Yogi Tower,
                    <br />
                    Bhilwara - 311001
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Working Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Saturday
                    <br />
                    10:00 AM - 6:00 PM IST
                    <br />
                    <span className="text-sm">Closed on Sundays</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 border border-border rounded-lg">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="text-primary hover:underline">
                    Refund & Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-primary hover:underline">
                    Shipping & Delivery Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <h3 className="font-semibold mb-4">Support Categories</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• General Inquiries</li>
                <li>• Account Support</li>
                <li>• Order Issues</li>
                <li>• Payment Questions</li>
                <li>• Technical Support</li>
                <li>• Designer Onboarding</li>
                <li>• Refund Requests</li>
              </ul>
            </div>

            <div className="p-6 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We aim to respond to all inquiries within 24-48 hours during business days. 
                For urgent matters, please call us directly.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 border border-border rounded-lg bg-muted/30">
          <h2 className="text-2xl font-semibold mb-4">WeDesignz</h2>
          <div className="space-y-2 text-foreground/80">
            <p><strong>Address:</strong> Sheetal Fab, B-117, Akar Tower, B-block, Old RTO road, Yogi Tower, Bhilwara - 311001</p>
            <p><strong>Support Email:</strong> <a href="mailto:support@wedesignz.com" className="text-primary hover:underline">support@wedesignz.com</a></p>
            <p><strong>General Inquiries:</strong> <a href="mailto:info@wedesignz.com" className="text-primary hover:underline">info@wedesignz.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:8000452183" className="text-primary hover:underline">8000452183</a></p>
            <p><strong>Working Hours:</strong> Monday - Saturday, 10 AM - 6 PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}

