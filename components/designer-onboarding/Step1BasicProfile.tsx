"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

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

interface Step1BasicProfileProps {
  initialData: Step1Data;
  onComplete: (data: Step1Data) => void;
}

export default function Step1BasicProfile({ initialData, onComplete }: Step1BasicProfileProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Step1Data>(initialData);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.profilePhotoUrl || null);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Prefill from auth context and load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      // First, prefill from auth context
      if (user) {
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || user.firstName || '',
          lastName: prev.lastName || user.lastName || '',
          email: prev.email || user.email || '',
          // Prioritize user.mobileNumber if it exists, otherwise use prev.phone
          phone: user.mobileNumber || prev.phone || '',
          // Check if email/phone are already verified from auth context
          emailVerified: prev.emailVerified || user.emailVerified || false,
          phoneVerified: prev.phoneVerified || user.mobileVerified || false,
        }));
      }

      // Then, try to load saved data
      try {
        const response = await apiClient.getDesignerOnboardingStep1();
        if (response.data?.data) {
          const saved = response.data.data;
          setFormData(prev => ({
            ...prev,
            firstName: saved.first_name || prev.firstName || user?.firstName || '',
            lastName: saved.last_name || prev.lastName || user?.lastName || '',
            email: saved.email || prev.email || user?.email || '',
            // Prioritize saved.phone, then user.mobileNumber, then prev.phone
            phone: saved.phone || user?.mobileNumber || prev.phone || '',
            isIndividual: saved.is_individual !== undefined ? saved.is_individual : prev.isIndividual,
            profilePhotoUrl: saved.profile_photo_url || null,
            // Use verification status from API if available, otherwise keep existing status
            emailVerified: saved.email_verified !== undefined ? saved.email_verified : prev.emailVerified,
            phoneVerified: saved.phone_verified !== undefined ? saved.phone_verified : prev.phoneVerified,
          }));
          // Set photo preview if profile photo URL exists
          if (saved.profile_photo_url) {
            setPhotoPreview(saved.profile_photo_url);
          } else {
            setPhotoPreview(null);
          }
        }
      } catch (error) {
        // No saved data, that's okay - use auth context data
        // Ensure we use user data if available
        if (user) {
          setFormData(prev => ({
            ...prev,
            firstName: prev.firstName || user.firstName || '',
            lastName: prev.lastName || user.lastName || '',
            email: prev.email || user.email || '',
            phone: prev.phone || user.mobileNumber || '',
          }));
        }
      } finally {
        setIsLoadingSaved(false);
      }
    };

    loadData();
  }, [user]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
  };

  const processPhotoFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, profilePhoto: 'File size must be less than 5MB' });
      toast.error('File size must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, profilePhoto: 'Please upload an image file' });
      toast.error('Please upload an image file');
      return;
    }
    setFormData({ ...formData, profilePhoto: file, profilePhotoUrl: null });
    setPhotoPreview(URL.createObjectURL(file));
    const newErrors = { ...errors };
    delete newErrors.profilePhoto;
    setErrors(newErrors);
    toast.success('Profile photo uploaded');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
  };

  const handleSendEmailOTP = async () => {
    if (!validateEmail(formData.email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }
    
    // Send OTP first, then open modal only if successful
    try {
      await sendEmailOTP();
      // Only open modal if OTP was sent successfully (no error thrown)
    setShowEmailOTP(true);
    } catch (error: any) {
      // Error already handled in sendEmailOTP with toast
      // Don't open modal if there's an error
    }
  };

  const handleSendPhoneOTP = () => {
    if (!validatePhone(formData.phone)) {
      setErrors({ ...errors, phone: 'Please enter a valid 10-digit phone number' });
      return;
    }
    // Just open the modal - OTP will be sent when modal opens
    setShowPhoneOTP(true);
  };

  const sendEmailOTP = async (): Promise<void> => {
    try {
      const response = await apiClient.resendOTP({
        email: formData.email,
        otp_for: 'email_verification',
      });
      
      if (response.error) {
        toast.error(response.error || 'Failed to send OTP');
        throw new Error(response.error || 'Failed to send OTP');
      }
      
      toast.success('OTP sent to your email');
    } catch (error: any) {
      console.error('Error in sendEmailOTP:', error);
      const errorMessage = error?.message || error?.error || 'Failed to send OTP';
      toast.error(errorMessage);
      throw error; // Re-throw to prevent modal from opening
    }
  };

  const sendPhoneOTP = async (): Promise<void> => {
    try {
      const response = await apiClient.resendOTP({
        mobile_number: formData.phone,
        otp_for: 'mobile_verification',
      });
      
      if (response.error) {
        toast.error(response.error || 'Failed to send OTP');
        return;
      }
      
    toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    }
  };

  const handleEmailVerified = async (otp: string) => {
    try {
      const response = await apiClient.verifyEmail(formData.email, otp);
      
      if (response.error) {
        // Map specific backend error messages to user-friendly messages
        const errorMessage = response.error === 'Invalid OTP' 
          ? 'Invalid OTP. Please check the code and try again.'
          : response.error === 'OTP has expired'
          ? 'OTP has expired. Please request a new one.'
          : response.error || 'Failed to verify email';
        toast.error(errorMessage);
        return false;
      }
      
      setFormData({ ...formData, emailVerified: true });
      setShowEmailOTP(false);
      toast.success('Email verified successfully!');
      
      return true;
    } catch (error: any) {
      // Extract error message from various possible formats
      const errorMessage = error?.response?.data?.error || 
                          error?.error || 
                          error?.message || 
                          'Failed to verify email. Please try again.';
      
      // Map specific backend error messages
      const mappedMessage = errorMessage === 'Invalid OTP' 
        ? 'Invalid OTP. Please check the code and try again.'
        : errorMessage === 'OTP has expired'
        ? 'OTP has expired. Please request a new one.'
        : errorMessage;
      
      toast.error(mappedMessage);
      return false;
    }
  };

  const handlePhoneVerified = async (otp: string) => {
    try {
      const response = await apiClient.verifyMobileNumber({
        mobile_number: formData.phone,
        otp: otp,
      });
      
      if (response.error) {
        // Map specific backend error messages to user-friendly messages
        const errorMessage = response.error === 'Invalid OTP' 
          ? 'Invalid OTP. Please check the code and try again.'
          : response.error === 'OTP has expired'
          ? 'OTP has expired. Please request a new one.'
          : response.error || 'Failed to verify phone';
        toast.error(errorMessage);
        return false;
      }
      
      setFormData({ ...formData, phoneVerified: true });
      setShowPhoneOTP(false);
      toast.success('Phone verified successfully!');
      
      return true;
    } catch (error: any) {
      // Extract error message from various possible formats
      const errorMessage = error?.response?.data?.error || 
                          error?.error || 
                          error?.message || 
                          'Failed to verify phone. Please try again.';
      
      // Map specific backend error messages
      const mappedMessage = errorMessage === 'Invalid OTP' 
        ? 'Invalid OTP. Please check the code and try again.'
        : errorMessage === 'OTP has expired'
        ? 'OTP has expired. Please request a new one.'
        : errorMessage;
      
      toast.error(mappedMessage);
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address';
    if (!validatePhone(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!formData.emailVerified) newErrors.emailVerified = 'Please verify your email';
    if (!formData.phoneVerified) newErrors.phoneVerified = 'Please verify your phone';
    if (!formData.profilePhoto && !formData.profilePhotoUrl) newErrors.profilePhoto = 'Profile photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before continuing');
      return;
    }

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      // Save Step 1 data to DB
      const response = await apiClient.saveDesignerOnboardingStep1({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        is_individual: formData.isIndividual,
        profile_photo: formData.profilePhoto || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('Step 1 data saved successfully');
      // Call onComplete after a small delay to ensure state is updated
      setTimeout(() => {
        onComplete(formData);
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Step 1 data');
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
    <>
      <Card className="p-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Basic Profile</h2>
              <p className="text-sm text-muted-foreground">
                We need to verify your identity to enable payouts and ensure platform security.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div
                  className={`w-32 h-32 rounded-full bg-muted border-4 overflow-hidden flex items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-primary border-dashed scale-105' : 'border-border'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center px-2">
                        {isDragging ? 'Drop here' : 'Click or drag'}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center cursor-pointer shadow-lg transition-all"
                >
                  <Upload className="w-5 h-5 text-primary-foreground" />
                </label>
              </div>
            </div>
            {errors.profilePhoto && (
              <p className="text-xs text-destructive flex items-center gap-1 justify-center">
                <AlertCircle className="w-3 h-3" />
                {errors.profilePhoto}
              </p>
            )}

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-semibold text-sm mb-2">Quick Tips:</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Use a professional profile photo</li>
                <li>• Verify both email and phone for payouts</li>
                <li>• Select Individual if you're a freelancer, Company if you have a business</li>
                <li>• Keep your details accurate</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value, emailVerified: false });
                      const newErrors = { ...errors };
                      delete newErrors.email;
                      setErrors(newErrors);
                    }}
                    placeholder="john@example.com"
                    disabled={formData.emailVerified}
                  />
                </div>
                <Button
                  type="button"
                  variant={formData.emailVerified ? "outline" : "default"}
                  size="sm"
                  className="shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSendEmailOTP();
                  }}
                  disabled={formData.emailVerified || !formData.email}
                >
                  {formData.emailVerified ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Verified
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
              {errors.emailVerified && !formData.emailVerified && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.emailVerified}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value, phoneVerified: false });
                      const newErrors = { ...errors };
                      delete newErrors.phone;
                      setErrors(newErrors);
                    }}
                    placeholder="9876543210"
                    disabled={formData.phoneVerified}
                  />
                </div>
                <Button
                  type="button"
                  variant={formData.phoneVerified ? "outline" : "default"}
                  size="sm"
                  className="shrink-0"
                  onClick={handleSendPhoneOTP}
                  disabled={formData.phoneVerified || !formData.phone}
                >
                  {formData.phoneVerified ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Verified
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
              {errors.phoneVerified && !formData.phoneVerified && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phoneVerified}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isIndividual">Onboard as <span className="text-destructive">*</span></Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isIndividual"
                    checked={formData.isIndividual === true}
                    onChange={() => setFormData({ ...formData, isIndividual: true })}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Individual</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isIndividual"
                    checked={formData.isIndividual === false}
                    onChange={() => setFormData({ ...formData, isIndividual: false })}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Company</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.isIndividual 
                  ? 'You will skip business details and go directly to legal information.'
                  : 'You will need to provide business details in the next step.'}
                </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
                disabled={!formData.emailVerified || !formData.phoneVerified || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Next: ${formData.isIndividual ? 'Legal Info' : 'Business Details'} →`
                )}
              </Button>
              {(!formData.emailVerified || !formData.phoneVerified) && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Please verify both email and phone to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <OTPVerificationModal
        open={showEmailOTP}
        onClose={() => setShowEmailOTP(false)}
        onVerified={handleEmailVerified}
        onResend={sendEmailOTP}
        type="email"
        value={formData.email}
      />

      <OTPVerificationModal
        open={showPhoneOTP}
        onClose={() => setShowPhoneOTP(false)}
        onVerified={handlePhoneVerified}
        onResend={sendPhoneOTP}
        type="phone"
        value={formData.phone}
      />
    </>
  );
}
