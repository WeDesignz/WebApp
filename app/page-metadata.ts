import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const homeMetadata: Metadata = {
  title: 'Home',
  description: 'Discover premium custom designs from talented designers worldwide. Browse our marketplace for logos, graphics, web designs, jerseys, and more. Join as a designer or find the perfect design for your project.',
  keywords: [
    'design marketplace',
    'custom designs',
    'graphic design',
    'logo design',
    'web design',
    'jersey design',
    'premium designs',
    'wedesignz',
    'wedesign',
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'WeDesignz - Premium Design Marketplace',
    description: 'Discover premium custom designs from talented designers worldwide. Browse our marketplace for logos, graphics, web designs, and more.',
    url: siteUrl,
    type: 'website',
    images: [
      {
        url: '/Logos/WD LOGO2048BLACK.png',
        width: 1200,
        height: 630,
        alt: 'WeDesignz - Premium Design Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WeDesignz - Premium Design Marketplace',
    description: 'Discover premium custom designs from talented designers worldwide',
    images: ['/Logos/WD LOGO2048BLACK.png'],
  },
};

