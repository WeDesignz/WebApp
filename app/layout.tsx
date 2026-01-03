import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Providers from "./providers";
import Script from "next/script";
import { Inter, Poppins } from "next/font/google";
import { OrganizationSchema, WebsiteSchema } from "@/components/SEO/StructuredData";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WeDesignz - Premium Design Marketplace | Custom Designs & Creative Solutions",
    template: "%s | WeDesignz"
  },
  description: "WeDesignz is the premier marketplace connecting talented designers with customers worldwide. Discover custom designs, creative solutions, and premium design services for your business.",
  keywords: [
    "design marketplace",
    "custom designs",
    "graphic design",
    "logo design",
    "web design",
    "freelance designers",
    "design services",
    "creative marketplace",
    "design portfolio",
    "jersey design",
    "brand identity",
    "wedesignz",
    "wedesign",
    "design platform",
    "creative services"
  ],
  authors: [{ name: "WeDesignz" }],
  creator: "WeDesignz",
  publisher: "WeDesignz",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
    shortcut: "/favicon/favicon.ico",
  },
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "WeDesignz",
    title: "WeDesignz - Premium Design Marketplace",
    description: "Connect with talented designers worldwide. Discover custom designs and creative solutions for your business.",
    images: [
      {
        url: "/Logos/WD LOGO2048BLACK.png",
        width: 1200,
        height: 630,
        alt: "WeDesignz - Design Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeDesignz - Premium Design Marketplace",
    description: "Connect with talented designers worldwide. Discover custom designs and creative solutions.",
    images: ["/Logos/WD LOGO2048BLACK.png"],
    creator: "@wedesignz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      "p:domain_verify": "7efb64ebb140ef75eb3643e0a9714d6b",
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Design Marketplace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <meta name="p:domain_verify" content="7efb64ebb140ef75eb3643e0a9714d6b" />
        <OrganizationSchema siteUrl={siteUrl} />
        <WebsiteSchema siteUrl={siteUrl} />
        {/* Theme-aware favicon switching */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function updateFavicon() {
                  const faviconSvg = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
                  const faviconPng = document.querySelector('link[rel="icon"][sizes="96x96"]');
                  
                  if (!faviconSvg || !faviconPng) return;
                  
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // SVG favicon supports theme switching via media attribute
                  if (isDark) {
                    faviconSvg.setAttribute('media', '(prefers-color-scheme: dark)');
                  } else {
                    faviconSvg.removeAttribute('media');
                  }
                }
                
                // Set initial favicon
                updateFavicon();
                
                // Listen for theme changes
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateFavicon);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


