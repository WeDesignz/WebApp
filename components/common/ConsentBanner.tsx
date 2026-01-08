"use client";

import { useState } from 'react';
import { useConsent } from '@/contexts/ConsentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll, acceptCustom, closeBanner } = useConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics_storage: true,
    ad_storage: false,
    ad_user_data: false,
    ad_personalization: false,
  });

  if (!showBanner) return null;

  const handleAcceptCustom = () => {
    acceptCustom({
      analytics_storage: preferences.analytics_storage ? 'granted' : 'denied',
      ad_storage: preferences.ad_storage ? 'granted' : 'denied',
      ad_user_data: preferences.ad_user_data ? 'granted' : 'denied',
      ad_personalization: preferences.ad_personalization ? 'granted' : 'denied',
    });
    setShowSettings(false);
  };

  return (
    <>
      {/* Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg animate-in slide-in-from-bottom">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-foreground mb-2">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                By clicking "Accept All", you consent to our use of cookies.{' '}
                <Link href="/cookie-policy" className="text-primary hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Analytics Cookies */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="analytics" className="text-base font-medium">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics_storage}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics_storage: checked })
                }
              />
            </div>

            {/* Advertising Cookies */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="ad_storage" className="text-base font-medium">
                  Advertising Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to make advertising messages more relevant to you and your interests.
                </p>
              </div>
              <Switch
                id="ad_storage"
                checked={preferences.ad_storage}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, ad_storage: checked })
                }
              />
            </div>

            {/* Ad User Data */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="ad_user_data" className="text-base font-medium">
                  Ad User Data
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allows us to use your data for advertising purposes.
                </p>
              </div>
              <Switch
                id="ad_user_data"
                checked={preferences.ad_user_data}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, ad_user_data: checked })
                }
              />
            </div>

            {/* Ad Personalization */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="ad_personalization" className="text-base font-medium">
                  Ad Personalization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enables personalized advertising based on your preferences and behavior.
                </p>
              </div>
              <Switch
                id="ad_personalization"
                checked={preferences.ad_personalization}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, ad_personalization: checked })
                }
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-4">
            For more information, please read our{' '}
            <Link href="/cookie-policy" className="text-primary hover:underline">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptCustom}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

