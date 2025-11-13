"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface DesignerVerificationContextType {
  verificationStatus: VerificationStatus;
  setVerificationStatus: (status: VerificationStatus) => void;
  isVerified: boolean;
}

const DesignerVerificationContext = createContext<DesignerVerificationContextType | undefined>(undefined);

export function DesignerVerificationProvider({ children }: { children: ReactNode }) {
  // For demo purposes, defaulting to 'pending'. In production, this would come from API/auth
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  
  const isVerified = verificationStatus === 'approved';

  return (
    <DesignerVerificationContext.Provider 
      value={{ 
        verificationStatus, 
        setVerificationStatus, 
        isVerified 
      }}
    >
      {children}
    </DesignerVerificationContext.Provider>
  );
}

export function useDesignerVerification() {
  const context = useContext(DesignerVerificationContext);
  if (context === undefined) {
    throw new Error('useDesignerVerification must be used within a DesignerVerificationProvider');
  }
  return context;
}
