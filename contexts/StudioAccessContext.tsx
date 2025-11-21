"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from './AuthContext';

interface StudioAccessContextType {
  hasFullAccess: boolean;
  isStudioOwner: boolean;
  isStudioMember: boolean;
  profileType: 'owner' | 'member' | 'individual';
  studioId: number | null;
  studioMembership: any | null;
  isLoading: boolean;
}

const StudioAccessContext = createContext<StudioAccessContextType | undefined>(undefined);

export function StudioAccessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [isStudioOwner, setIsStudioOwner] = useState(false);
  const [isStudioMember, setIsStudioMember] = useState(false);
  const [profileType, setProfileType] = useState<'owner' | 'member' | 'individual'>('individual');
  const [studioId, setStudioId] = useState<number | null>(null);
  const [studioMembership, setStudioMembership] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudioAccess = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiClient.getDesignerOnboardingStatus();
        
        if (response.error) {
          console.error('Error fetching studio access:', response.error);
          // Default to no access on error
          setHasFullAccess(false);
          setIsStudioOwner(false);
          setIsStudioMember(false);
          setProfileType('individual');
        } else if (response.data?.profile_info) {
          const profileInfo = response.data.profile_info;
          
          setHasFullAccess(profileInfo.has_full_console_access || false);
          setIsStudioOwner(profileInfo.is_studio_owner || false);
          setIsStudioMember(profileInfo.is_studio_member || false);
          setProfileType(profileInfo.profile_type || 'individual');
          
          // Get studio ID from owned studio or membership
          if (profileInfo.owned_studio?.id) {
            setStudioId(profileInfo.owned_studio.id);
          } else if (profileInfo.studio_membership?.studio?.id) {
            setStudioId(profileInfo.studio_membership.studio.id);
          } else {
            setStudioId(null);
          }
          
          setStudioMembership(profileInfo.studio_membership || null);
        } else {
          // Default values if no profile info
          setHasFullAccess(false);
          setIsStudioOwner(false);
          setIsStudioMember(false);
          setProfileType('individual');
        }
      } catch (error) {
        console.error('Error fetching studio access:', error);
        setHasFullAccess(false);
        setIsStudioOwner(false);
        setIsStudioMember(false);
        setProfileType('individual');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudioAccess();
  }, [isAuthenticated]);

  return (
    <StudioAccessContext.Provider 
      value={{ 
        hasFullAccess,
        isStudioOwner,
        isStudioMember,
        profileType,
        studioId,
        studioMembership,
        isLoading
      }}
    >
      {children}
    </StudioAccessContext.Provider>
  );
}

export function useStudioAccess() {
  const context = useContext(StudioAccessContext);
  if (context === undefined) {
    throw new Error('useStudioAccess must be used within a StudioAccessProvider');
  }
  return context;
}

