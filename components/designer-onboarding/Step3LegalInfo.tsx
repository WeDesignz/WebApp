"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface Step3Data {
  panNumber: string;
  panCard: File | null;
  panCardUrl: string | null;
}

interface Step3LegalInfoProps {
  initialData: Step3Data;
  onBack: () => void;
  onComplete: (data: Step3Data) => void;
  isIndividual: boolean;
}

export default function Step3LegalInfo({ initialData, onBack, onComplete, isIndividual }: Step3LegalInfoProps) {
  const [formData, setFormData] = useState<Step3Data>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiClient.getDesignerOnboardingStep3();
        if (response.data?.data) {
          const saved = response.data.data;
          setFormData(prev => ({
            ...prev,
            panNumber: saved.pan_number || prev.panNumber,
            panCardUrl: saved.pan_card_url || null,
          }));
        }
      } catch (error) {
        // No saved data, that's okay
        console.log('No saved Step 3 data found');
      } finally {
        setIsLoadingSaved(false);
      }
    };

    loadData();
  }, []);

  const validatePAN = (pan: string) => {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(pan);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, panCard: 'File size must be less than 10MB' });
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, panCard: file, panCardUrl: null });
      const newErrors = { ...errors };
      delete newErrors.panCard;
      setErrors(newErrors);
      toast.success('PAN card document uploaded');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validatePAN(formData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    if (!formData.panCard && !formData.panCardUrl) {
      newErrors.panCard = 'PAN card document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      const errorMessages = Object.values(errors).join(', ');
      toast.error(`Please fix the following errors: ${errorMessages}`);
      return;
    }

    setIsLoading(true);
    try {
      // Save Step 3 data to DB
      const response = await apiClient.saveDesignerOnboardingStep3({
        pan_number: formData.panNumber,
        pan_card: formData.panCard || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        setIsLoading(false);
        return;
      }

      toast.success('Step 3 data saved successfully');
      onComplete(formData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Step 3 data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingSaved) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold mb-2">Legal Information</h2>
          <p className="text-sm text-muted-foreground">
            {isIndividual 
              ? 'Enter your personal PAN card details for tax and payout purposes.'
              : 'Enter your business PAN card details for tax and payout purposes.'}
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="panNumber">
              {isIndividual ? 'Personal' : 'Business'} PAN Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="panNumber"
              value={formData.panNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                setFormData({ ...formData, panNumber: value });
                const newErrors = { ...errors };
                delete newErrors.panNumber;
                setErrors(newErrors);
              }}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            {errors.panNumber && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.panNumber}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="panCard">
              {isIndividual ? 'Personal' : 'Business'} PAN Card Document <span className="text-destructive">*</span>
            </Label>
            {formData.panCardUrl && !formData.panCard && (
              <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    PAN card already uploaded. Upload a new file to replace it.
                  </p>
                </div>
                {formData.panCardUrl && (
                  <a 
                    href={formData.panCardUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
                  >
                    View uploaded PAN card
                  </a>
                )}
              </div>
            )}
            <div className="relative">
              <Input
                id="panCard"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {(formData.panCard || formData.panCardUrl) && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {formData.panCard && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {formData.panCard.name}
              </p>
            )}
            {formData.panCardUrl && !formData.panCard && (
              <p className="text-xs text-muted-foreground">
                Previously uploaded document is saved
              </p>
            )}
            {errors.panCard && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.panCard}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Upload a clear image or PDF of your PAN card (max 10MB)
            </p>
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Note:</strong> PAN is mandatory for all payouts. Make sure the document is clear and readable.
            </p>
          </div>
        </div>

        <div className="border-t pt-6 flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Next: Upload Designs →'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

