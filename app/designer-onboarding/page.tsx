import { Suspense } from 'react';
import { Metadata } from 'next';
import DesignerOnboardingWizard from '@/components/designer-onboarding/DesignerOnboardingWizard';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wedesignz.com';

export const metadata: Metadata = {
  title: 'Designer Onboarding',
  description: 'Join the WeDesignz designer program and start earning. Create your designer profile, showcase your portfolio, and connect with customers worldwide. Start your creative journey today.',
  keywords: ['become a designer', 'designer signup', 'freelance designer', 'designer program', 'join as designer'],
  alternates: {
    canonical: `${siteUrl}/designer-onboarding`,
  },
  openGraph: {
    title: 'Designer Onboarding - WeDesignz',
    description: 'Join the WeDesignz designer program and start earning. Create your designer profile and showcase your portfolio.',
    url: `${siteUrl}/designer-onboarding`,
    type: 'website',
    images: [
      {
        url: '/Logos/WD LOGO2048BLACK.png',
        width: 1200,
        height: 630,
        alt: 'WeDesignz - Designer Onboarding',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Designer Onboarding - WeDesignz',
    description: 'Join the WeDesignz designer program and start earning',
  },
};

export default function DesignerOnboardingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DesignerOnboardingWizard />
    </Suspense>
  );
}
