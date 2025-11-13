import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Providers from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "WeDesign",
  description: "WeDesign – Empowering Creative Collaboration",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


