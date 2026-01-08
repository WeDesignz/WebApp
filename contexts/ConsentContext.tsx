"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type ConsentStatus = 'granted' | 'denied';

interface ConsentPreferences {
  analytics_storage: ConsentStatus;
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
}

interface ConsentContextType {
  consentGiven: boolean | null;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptCustom: (preferences: Partial<ConsentPreferences>) => void;
  openSettings: () => void;
  closeBanner: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const CONSENT_KEY = 'wedesignz_consent';
const CONSENT_EXPIRY_DAYS = 365;

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent was previously given
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const consent = JSON.parse(stored);
        const expiryDate = new Date(consent.expiry);
        if (expiryDate > new Date()) {
          setConsentGiven(consent.value);
          updateGoogleConsent(consent.preferences);
          return;
        }
      } catch (e) {
        // Invalid stored consent
      }
    }
    // Show banner if no valid consent found
    setShowBanner(true);
  }, []);

  const updateGoogleConsent = (preferences: ConsentPreferences) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', preferences);
    }
  };

  const saveConsent = (preferences: ConsentPreferences) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CONSENT_EXPIRY_DAYS);
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      value: true,
      preferences,
      expiry: expiry.toISOString(),
    }));
    
    setConsentGiven(true);
    setShowBanner(false);
    updateGoogleConsent(preferences);
  };

  const acceptAll = () => {
    saveConsent({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  };

  const rejectAll = () => {
    saveConsent({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  };

  const acceptCustom = (preferences: Partial<ConsentPreferences>) => {
    saveConsent({
      analytics_storage: preferences.analytics_storage || 'denied',
      ad_storage: preferences.ad_storage || 'denied',
      ad_user_data: preferences.ad_user_data || 'denied',
      ad_personalization: preferences.ad_personalization || 'denied',
    });
  };

  const openSettings = () => {
    setShowBanner(true);
  };

  const closeBanner = () => {
    setShowBanner(false);
  };

  return (
    <ConsentContext.Provider
      value={{
        consentGiven,
        showBanner,
        acceptAll,
        rejectAll,
        acceptCustom,
        openSettings,
        closeBanner,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}

