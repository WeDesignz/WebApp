import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Providers from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "WeDesign",
  description: "WeDesign – Empowering Creative Collaboration",
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
  other: {
    "p:domain_verify": "7efb64ebb140ef75eb3643e0a9714d6b",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="p:domain_verify" content="7efb64ebb140ef75eb3643e0a9714d6b" />
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


