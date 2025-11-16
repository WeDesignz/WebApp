"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface DesignerConsoleGuardProps {
  children: React.ReactNode;
}

export default function DesignerConsoleGuard({ children }: DesignerConsoleGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Step 1: Check if user is authenticated
      if (!isAuthenticated) {
        // Redirect to register/signup if not authenticated
        router.push('/auth/register');
        return;
      }

      // Step 2: If authenticated, check onboarding status
      try {
        setIsCheckingOnboarding(true);
        const response = await apiClient.getDesignerOnboardingStatus();
        
        if (response.error) {
          console.error('Error checking onboarding status:', response.error);
          // If there's an error (e.g., designer profile not found), redirect to onboarding
          router.push('/designer-onboarding');
          return;
        }

        // Check if user can access console
        if (response.data?.can_access_console) {
          setOnboardingComplete(true);
        } else {
          // Onboarding not complete, redirect to onboarding page
          router.push('/designer-onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, redirect to onboarding
        router.push('/designer-onboarding');
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, authLoading, router]);

  // Show loading state while checking authentication or onboarding
  if (authLoading || isCheckingOnboarding || !onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and onboarding is complete, render children
  return <>{children}</>;
}

