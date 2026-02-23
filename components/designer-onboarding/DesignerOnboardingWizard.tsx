"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import Step1BasicProfile from './Step1BasicProfile';
import Step2BusinessDetails from './Step2BusinessDetails';
import Step3LegalInfo from './Step3LegalInfo';
import Step4BankDetails from './Step4BankDetails';
import Step4BulkUpload from './Step4BulkUpload';

interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto: File | null;
  profilePhotoUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isIndividual: boolean;
}

interface Step2Data {
  businessEmail: string;
  businessPhone: string;
  businessEmailVerified: boolean;
  businessPhoneVerified: boolean;
  legalBusinessName: string;
  businessType: string;
  category: string;
  subcategory: string;
  businessModel: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber: string;
  msmeNumber: string;
  msmeAnnexure: File | null;
  msmeAnnexureUrl: string | null;
}

interface Step3Data {
  panNumber: string;
  panCard: File | null;
  panCardUrl: string | null;
}

interface Step4Data {
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolderName: string;
  accountType: 'savings' | 'current' | '';
}

export default function DesignerOnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePhoto: null,
    profilePhotoUrl: null,
    emailVerified: false,
    phoneVerified: false,
    isIndividual: false,
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    businessEmail: '',
    businessPhone: '',
    businessEmailVerified: false,
    businessPhoneVerified: false,
    legalBusinessName: '',
    businessType: '',
    category: '',
    subcategory: '',
    businessModel: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    gstNumber: '',
    msmeNumber: '',
    msmeAnnexure: null,
    msmeAnnexureUrl: null,
  });

  const [step3Data, setStep3Data] = useState<Step3Data>({
    panNumber: '',
    panCard: null,
    panCardUrl: null,
  });

  const [step4Data, setStep4Data] = useState<Step4Data>({
    bankAccountNumber: '',
    bankIfscCode: '',
    bankAccountHolderName: '',
    accountType: '',
  });

  // Check if onboarding is already completed when component mounts
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // If not authenticated, allow them to proceed (they'll need to login during onboarding)
      if (!isAuthenticated) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        setIsCheckingOnboarding(true);
        const response = await apiClient.getDesignerOnboardingStatus();
        
        if (response.error) {
          // If there's an error, allow them to proceed with onboarding
          setIsCheckingOnboarding(false);
          return;
        }

        // Check if user can access console (onboarding is complete)
        if (response.data?.can_access_console) {
          // Onboarding already completed, redirect away
          
          // Priority 1: Use redirect query parameter if provided
          const redirectParam = searchParams.get('redirect');
          if (redirectParam) {
            router.replace(decodeURIComponent(redirectParam));
            return;
          }
          
          // Priority 2: Check if they came from somewhere (referrer)
          // Only use referrer if it's a valid internal path (not external site)
          if (typeof window !== 'undefined' && document.referrer) {
            try {
              const referrerUrl = new URL(document.referrer);
              const currentUrl = new URL(window.location.href);
              
              // Only use referrer if it's from the same origin
              if (referrerUrl.origin === currentUrl.origin) {
                const referrerPath = referrerUrl.pathname + referrerUrl.search;
                // Don't redirect back to onboarding or auth pages
                if (!referrerPath.includes('/designer-onboarding') && 
                    !referrerPath.includes('/auth/')) {
                  router.replace(referrerPath);
                  return;
                }
              }
            } catch (e) {
              // Invalid referrer URL, continue to default
            }
          }
          
          // Priority 3: Default to designer console
          router.replace('/designer-console');
          return;
        }

        // Onboarding not complete, allow them to proceed
        setIsCheckingOnboarding(false);
      } catch (error) {
        // On error, allow them to proceed with onboarding
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, authLoading, router, searchParams]);

  // Determine which step to show based on isIndividual
  const getNextStep = (fromStep: number, isIndividual: boolean) => {
    if (fromStep === 1) {
      return isIndividual ? 3 : 2; // Skip Step 2 if individual
    }
    return fromStep + 1;
  };

  const handleStep1Complete = (data: Step1Data) => {
    setStep1Data(data);
    const nextStep = getNextStep(1, data.isIndividual);
    setCurrentStep(nextStep);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep2Complete = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep3Back = () => {
    // Go back to Step 2 if company, Step 1 if individual
    if (step1Data.isIndividual) {
      setCurrentStep(1);
    } else {
    setCurrentStep(2);
    }
  };

  const handleStep3Complete = (data: Step3Data) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  const handleStep4Back = () => {
    setCurrentStep(3);
  };

  const handleStep4Complete = (data: Step4Data) => {
    setStep4Data(data);
    setCurrentStep(5);
  };

  const handleStep5Back = () => {
    setCurrentStep(4);
  };

  const handleStep5Complete = (bulkFile: File) => {
    // Toast is already shown in Step5BulkUpload component
    // Get redirect destination from query params, default to designer-console
    const redirectTo = searchParams.get('redirect') || '/designer-console';
    
    // Just redirect after a short delay to ensure toast is visible
    setTimeout(() => {
      router.push(decodeURIComponent(redirectTo));
    }, 1500);
  };

  // Calculate progress steps based on isIndividual
  const getProgressSteps = () => {
    if (step1Data.isIndividual) {
      return [
        { number: 1, label: 'Basic Profile', completed: currentStep > 1, stepValue: 1 },
        { number: 2, label: 'Legal Info', completed: currentStep > 3, stepValue: 3 },
        { number: 3, label: 'Bank Details', completed: currentStep > 4, stepValue: 4 },
        { number: 4, label: 'Upload Designs', completed: currentStep > 5, stepValue: 5 },
      ];
    }
    return [
      { number: 1, label: 'Basic Profile', completed: currentStep > 1, stepValue: 1 },
      { number: 2, label: 'Business Details', completed: currentStep > 2, stepValue: 2 },
      { number: 3, label: 'Legal Info', completed: currentStep > 3, stepValue: 3 },
      { number: 4, label: 'Bank Details', completed: currentStep > 4, stepValue: 4 },
      { number: 5, label: 'Upload Designs', completed: currentStep > 5, stepValue: 5 },
    ];
  };

  const progressSteps = getProgressSteps();

  // Show loading state while checking onboarding status
  if (isCheckingOnboarding || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img 
              src="/Logos/ONLY LOGO.png" 
              alt="WeDesignz Logo" 
              className="h-12 w-auto brightness-0 invert"
            />
            <img 
              src="/Logos/ONLY TEXT.png" 
              alt="WeDesignz" 
              className="h-8 w-auto brightness-0 invert"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Welcome to the Designer Program</h1>
          <p className="text-white">Let&apos;s get you set up to start earning</p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            {progressSteps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center gap-2 ${step.completed || currentStep === step.stepValue ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.completed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                      currentStep === step.stepValue ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      {step.number}
                </div>
              )}
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < progressSteps.length - 1 && (
                  <div className={`h-px w-12 mx-4 ${step.completed ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Step1BasicProfile
                initialData={step1Data}
                onComplete={handleStep1Complete}
              />
            </motion.div>
          )}
          
          {currentStep === 2 && !step1Data.isIndividual && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Step2BusinessDetails
                initialData={step2Data}
                onBack={handleStep2Back}
                onComplete={handleStep2Complete}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Step3LegalInfo
                initialData={step3Data}
                onBack={handleStep3Back}
                onComplete={handleStep3Complete}
                isIndividual={step1Data.isIndividual}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Step4BankDetails
                initialData={step4Data}
                onBack={handleStep4Back}
                onComplete={handleStep4Complete}
              />
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Step4BulkUpload
                onBack={handleStep5Back}
                onComplete={handleStep5Complete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
