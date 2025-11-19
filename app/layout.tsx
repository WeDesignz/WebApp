import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Providers from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "WeDesign",
  description: "WeDesign – Empowering Creative Collaboration",
  other: {
    "p:domain_verify": "7efb64ebb140ef75eb3643e0a9714d6b",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="p:domain_verify" content="7efb64ebb140ef75eb3643e0a9714d6b" />
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


