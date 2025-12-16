"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check, AlertCircle, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface Step4Data {
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolderName: string;
  accountType: 'savings' | 'current' | '';
}

interface Step4BankDetailsProps {
  initialData: Step4Data;
  onBack: () => void;
  onComplete: (data: Step4Data) => void;
}

export default function Step4BankDetails({ initialData, onBack, onComplete }: Step4BankDetailsProps) {
  const [formData, setFormData] = useState<Step4Data>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiClient.getDesignerOnboardingStep4();
        if (response.data?.data) {
          const saved = response.data.data;
          setFormData(prev => ({
            ...prev,
            bankAccountNumber: saved.bank_account_number || prev.bankAccountNumber,
            bankIfscCode: saved.bank_ifsc_code || prev.bankIfscCode,
            bankAccountHolderName: saved.bank_account_holder_name || prev.bankAccountHolderName,
            accountType: (saved.account_type as 'savings' | 'current') || prev.accountType,
          }));
        }
      } catch (error) {
        // No saved data, that's okay
      } finally {
        setIsLoadingSaved(false);
      }
    };

    loadData();
  }, []);

  const validateIFSC = (ifsc: string) => {
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return regex.test(ifsc);
  };

  const validateAccountNumber = (accountNumber: string) => {
    // Account number should be 9-18 digits
    const regex = /^\d{9,18}$/;
    return regex.test(accountNumber);
  };

  const handleInputChange = (field: keyof Step4Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankAccountNumber.trim()) {
      newErrors.bankAccountNumber = 'Bank account number is required';
    } else if (!validateAccountNumber(formData.bankAccountNumber)) {
      newErrors.bankAccountNumber = 'Account number must be 9-18 digits';
    }

    if (!formData.bankIfscCode.trim()) {
      newErrors.bankIfscCode = 'IFSC code is required';
    } else if (!validateIFSC(formData.bankIfscCode)) {
      newErrors.bankIfscCode = 'Invalid IFSC format (e.g., HDFC0001234)';
    }

    if (!formData.bankAccountHolderName.trim()) {
      newErrors.bankAccountHolderName = 'Account holder name is required';
    } else if (formData.bankAccountHolderName.trim().length < 3) {
      newErrors.bankAccountHolderName = 'Account holder name must be at least 3 characters';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
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
      // Save Step 4 data to DB
      const response = await apiClient.saveDesignerOnboardingStep4({
        bank_account_number: formData.bankAccountNumber.trim(),
        bank_ifsc_code: formData.bankIfscCode.trim().toUpperCase(),
        bank_account_holder_name: formData.bankAccountHolderName.trim(),
        account_type: formData.accountType as 'savings' | 'current',
      });

      if (response.error) {
        toast.error(response.error);
        setIsLoading(false);
        return;
      }

      toast.success('Bank details saved successfully');
      onComplete(formData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bank details');
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
          <h2 className="text-2xl font-bold mb-2">Bank Account Details</h2>
          <p className="text-sm text-muted-foreground">
            Enter your bank account details for receiving payouts and settlements. This information is encrypted and secure.
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Your data is secure
              </p>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                All bank account information is encrypted and stored securely. This data is only used for processing your payouts.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountHolderName">
              Account Holder Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bankAccountHolderName"
              value={formData.bankAccountHolderName}
              onChange={(e) => handleInputChange('bankAccountHolderName', e.target.value)}
              placeholder="Enter name as per bank records"
              maxLength={100}
            />
            {errors.bankAccountHolderName && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.bankAccountHolderName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the name exactly as it appears on your bank account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">
              Bank Account Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bankAccountNumber"
              type="text"
              value={formData.bankAccountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 18);
                handleInputChange('bankAccountNumber', value);
              }}
              placeholder="Enter your bank account number"
              maxLength={18}
            />
            {errors.bankAccountNumber && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.bankAccountNumber}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Account number must be 9-18 digits
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankIfscCode">
              IFSC Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bankIfscCode"
              value={formData.bankIfscCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                handleInputChange('bankIfscCode', value);
              }}
              placeholder="HDFC0001234"
              maxLength={11}
            />
            {errors.bankIfscCode && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.bankIfscCode}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: 4 letters, 0, 6 alphanumeric characters (e.g., HDFC0001234)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType">
              Account Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.accountType}
              onValueChange={(value) => handleInputChange('accountType', value)}
            >
              <SelectTrigger id="accountType">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings Account</SelectItem>
                <SelectItem value="current">Current Account</SelectItem>
              </SelectContent>
            </Select>
            {errors.accountType && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.accountType}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the type of bank account you want to use for payouts
            </p>
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Important:</strong> Make sure all details are correct. Incorrect information may delay or prevent payouts. 
              Razorpay will verify your bank account with a small test transaction.
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

