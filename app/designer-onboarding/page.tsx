import { Suspense } from 'react';
import DesignerOnboardingWizard from '@/components/designer-onboarding/DesignerOnboardingWizard';

export const metadata = {
  title: 'Designer Onboarding | WeDesignz',
  description: 'Join the WeDesignz designer program and start earning',
};

export default function DesignerOnboardingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DesignerOnboardingWizard />
    </Suspense>
  );
}
