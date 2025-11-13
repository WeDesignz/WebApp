"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Step1BasicProfile from './Step1BasicProfile';
import Step2BusinessDetails from './Step2BusinessDetails';
import Step3BulkUpload from './Step3BulkUpload';

export default function DesignerOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null as File | null,
    emailVerified: false,
    phoneVerified: false,
  });

  const [step2Data, setStep2Data] = useState({
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
    panNumber: '',
    panDocument: null as File | null,
    gstNumber: '',
    msmeNumber: '',
    msmeAnnexure: null as File | null,
  });

  const [step3Data, setStep3Data] = useState<File | null>(null);

  const handleStep1Complete = (data: typeof step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep2Complete = (data: typeof step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep3Complete = (bulkFile: File) => {
    setStep3Data(bulkFile);
    router.push('/designer-console');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">W</span>
            </div>
            <span className="font-display font-bold text-2xl">WeDesignz Designer</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to the Designer Program</h1>
          <p className="text-muted-foreground">Let&apos;s get you set up to start earning</p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              {currentStep > 1 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${currentStep === 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                  1
                </div>
              )}
              <span className="text-sm font-medium">Basic Profile</span>
            </div>
            <div className={`h-px w-12 ${currentStep > 1 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              {currentStep > 2 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${currentStep === 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                  2
                </div>
              )}
              <span className="text-sm font-medium">Business Details</span>
            </div>
            <div className={`h-px w-12 ${currentStep > 2 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${currentStep === 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                3
              </div>
              <span className="text-sm font-medium">Upload Designs</span>
            </div>
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
          
          {currentStep === 2 && (
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
              <Step3BulkUpload
                onBack={handleStep3Back}
                onComplete={handleStep3Complete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
