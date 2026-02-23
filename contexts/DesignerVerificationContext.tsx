"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './AuthContext';

type VerificationStatus = 'pending' | 'verified' | 'suspended';

interface DesignerVerificationContextType {
  verificationStatus: VerificationStatus;
  setVerificationStatus: (status: VerificationStatus) => void;
  isVerified: boolean;
  isLoading: boolean;
}

const DesignerVerificationContext = createContext<DesignerVerificationContextType | undefined>(undefined);

export function DesignerVerificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  
  // Map backend status to context status
  // Backend: 'pending' | 'verified' | 'suspended'
  // Context: 'pending' | 'verified' | 'suspended'
  const mapBackendStatus = (backendStatus: string): VerificationStatus => {
    if (backendStatus === 'verified') return 'verified';
    if (backendStatus === 'suspended') return 'suspended';
    return 'pending'; // default to pending
  };
  
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiClient.getDesignerOnboardingStatus();
        
        if (response.error) {
          setVerificationStatus('pending');
        } else {
          // Check if user is a studio member (they don't need verification)
          const isStudioMember = response.data?.profile_info?.is_studio_member && 
                                 !response.data?.profile_info?.has_full_console_access;
          
          if (isStudioMember) {
            // Studio members are considered "verified" for their limited access
            setVerificationStatus('verified');
          } else if (response.data?.onboarding_status?.designer_profile_status) {
            const backendStatus = response.data.onboarding_status.designer_profile_status;
            setVerificationStatus(mapBackendStatus(backendStatus));
          } else {
            setVerificationStatus('pending');
          }
        }
      } catch (error) {
        setVerificationStatus('pending');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [isAuthenticated]);
  
  const isVerified = verificationStatus === 'verified';

  return (
    <DesignerVerificationContext.Provider 
      value={{ 
        verificationStatus, 
        setVerificationStatus, 
        isVerified,
        isLoading
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
