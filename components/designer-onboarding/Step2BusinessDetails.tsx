"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';

interface Step2Data {
  businessEmail: string;
  businessPhone: string;
  businessEmailVerified: boolean;
  businessPhoneVerified: boolean;
  legalBusinessName: string;
  businessType: string;
  category: string;
  subcategory: string;
  businessModel: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber: string;
  msmeNumber: string;
  msmeAnnexure: File | null;
  msmeAnnexureUrl: string | null;
}

interface Step2BusinessDetailsProps {
  initialData: Step2Data;
  onBack: () => void;
  onComplete: (data: Step2Data) => void;
}

export default function Step2BusinessDetails({ initialData, onBack, onComplete }: Step2BusinessDetailsProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Step2Data>(initialData);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [usePersonalEmail, setUsePersonalEmail] = useState(false);
  const [usePersonalPhone, setUsePersonalPhone] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiClient.getDesignerOnboardingStep2();
        if (response.data?.data) {
          const saved = response.data.data;
          
          // Check if studio email/phone matches personal email/phone
          const isPersonalEmail = saved.studio_email && user?.email && saved.studio_email === user.email;
          const isPersonalPhone = saved.studio_mobile_number && user?.mobileNumber && saved.studio_mobile_number === user.mobileNumber;
          
          // Set verification status based on backend response or personal verification status
          let emailVerified = saved.studio_email_verified || false;
          let phoneVerified = saved.studio_mobile_verified || false;
          
          // If using personal email/phone, check user's verification status
          if (isPersonalEmail && user?.emailVerified) {
            emailVerified = true;
            setUsePersonalEmail(true);
          }
          if (isPersonalPhone && user?.mobileVerified) {
            phoneVerified = true;
            setUsePersonalPhone(true);
          }
          
          setFormData(prev => ({
            ...prev,
            legalBusinessName: saved.legal_business_name || prev.legalBusinessName,
            businessType: saved.business_type || prev.businessType,
            businessModel: saved.business_model || prev.businessModel,
            category: saved.business_category || prev.category,
            subcategory: saved.business_sub_category || prev.subcategory,
            street: saved.street || prev.street,
            city: saved.city || prev.city,
            state: saved.state || prev.state,
            postalCode: saved.postal_code || prev.postalCode,
            country: saved.country || prev.country,
            businessEmail: saved.studio_email || prev.businessEmail,
            businessPhone: saved.studio_mobile_number || prev.businessPhone,
            businessEmailVerified: emailVerified,
            businessPhoneVerified: phoneVerified,
            gstNumber: saved.gst_number || prev.gstNumber,
            msmeNumber: saved.msme_udyam_number || prev.msmeNumber,
            msmeAnnexureUrl: saved.msme_certificate_annexure_url || null,
          }));
        }
      } catch (error) {
        // No saved data, that's okay
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

  const handleUsePersonalEmail = () => {
    if (user?.email) {
      // Check if personal email is already verified
      const isEmailVerified = user.emailVerified || false;
      setFormData({ 
        ...formData, 
        businessEmail: user.email, 
        businessEmailVerified: isEmailVerified 
      });
      setUsePersonalEmail(true);
      if (isEmailVerified) {
        toast.success('Personal email filled (already verified)');
      } else {
        toast.success('Personal email filled');
      }
    }
  };

  const handleUsePersonalPhone = () => {
    if (user?.mobileNumber) {
      // Check if personal phone is already verified
      const isPhoneVerified = user.mobileVerified || false;
      setFormData({ 
        ...formData, 
        businessPhone: user.mobileNumber, 
        businessPhoneVerified: isPhoneVerified 
      });
      setUsePersonalPhone(true);
      if (isPhoneVerified) {
        toast.success('Personal phone filled (already verified)');
      } else {
        toast.success('Personal phone filled');
      }
    }
  };

  const handleSendEmailOTP = async () => {
    if (!validateEmail(formData.businessEmail)) {
      setErrors({ ...errors, businessEmail: 'Please enter a valid email address' });
      return;
    }
    // Send OTP first, then open modal only if successful
    try {
      await sendEmailOTP();
      // Only open modal if OTP was sent successfully (no error thrown)
    setShowEmailOTP(true);
    } catch (error: any) {
      // Error already handled in sendEmailOTP with toast
      console.error('Error sending email OTP:', error);
      // Don't open modal if there's an error
    }
  };

  const handleSendPhoneOTP = () => {
    if (!validatePhone(formData.businessPhone)) {
      setErrors({ ...errors, businessPhone: 'Please enter a valid 10-digit phone number' });
      return;
    }
    // Just open the modal - OTP will be sent when modal opens
    setShowPhoneOTP(true);
  };

  const sendEmailOTP = async (): Promise<void> => {
    try {
      const response = await apiClient.resendOTP({
        email: formData.businessEmail,
        otp_for: 'email_verification',
      });
      
      if (response.error) {
        toast.error(response.error || 'Failed to send OTP');
        throw new Error(response.error || 'Failed to send OTP');
      }
      
      toast.success('OTP sent to your business email');
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
        mobile_number: formData.businessPhone,
        otp_for: 'mobile_verification',
      });
      
      if (response.error) {
        toast.error(response.error || 'Failed to send OTP');
        return;
      }
      
    toast.success('OTP sent to your business phone');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    }
  };

  const handleEmailVerified = async (otp: string): Promise<boolean> => {
    try {
      const response = await apiClient.verifyEmail(formData.businessEmail, otp);
      
      if (response.error) {
        // Map specific backend error messages to user-friendly messages
        const errorMessage = response.error === 'Invalid OTP' 
          ? 'Invalid OTP. Please check the code and try again.'
          : response.error === 'OTP has expired'
          ? 'OTP has expired. Please request a new one.'
          : response.error || 'Failed to verify business email';
        toast.error(errorMessage);
        return false;
      }
      
      setFormData({ ...formData, businessEmailVerified: true });
      setShowEmailOTP(false);
      toast.success('Business email verified successfully!');
      return true;
    } catch (error: any) {
      // Extract error message from various possible formats
      const errorMessage = error?.response?.data?.error || 
                          error?.error || 
                          error?.message || 
                          'Failed to verify business email. Please try again.';
      
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

  const handlePhoneVerified = async (otp: string): Promise<boolean> => {
    try {
      const response = await apiClient.verifyMobileNumber({
        mobile_number: formData.businessPhone,
        otp: otp,
      });
      
      if (response.error) {
        // Map specific backend error messages to user-friendly messages
        const errorMessage = response.error === 'Invalid OTP' 
          ? 'Invalid OTP. Please check the code and try again.'
          : response.error === 'OTP has expired'
          ? 'OTP has expired. Please request a new one.'
          : response.error || 'Failed to verify business phone';
        toast.error(errorMessage);
        return false;
      }
      
      setFormData({ ...formData, businessPhoneVerified: true });
      setShowPhoneOTP(false);
      toast.success('Business phone verified successfully!');
      return true;
    } catch (error: any) {
      // Extract error message from various possible formats
      const errorMessage = error?.response?.data?.error || 
                          error?.error || 
                          error?.message || 
                          'Failed to verify business phone. Please try again.';
      
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, msmeAnnexure: 'File size must be less than 10MB' });
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, msmeAnnexure: file, msmeAnnexureUrl: null });
      const newErrors = { ...errors };
      delete newErrors.msmeAnnexure;
      setErrors(newErrors);
      toast.success('MSME certificate uploaded');
    }
  };

  const businessTypes = ['individual', 'partnership', 'company', 'llp', 'other'];
  const categories = ['ecommerce', 'other'];
  const subcategories = ['residential', 'commercial', 'other'];
  const businessModels = ['Freelancer', 'Agency', 'Studio', 'Consultancy'];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateEmail(formData.businessEmail)) newErrors.businessEmail = 'Invalid email';
    if (!validatePhone(formData.businessPhone)) newErrors.businessPhone = 'Invalid phone';
    if (!formData.businessEmailVerified) newErrors.businessEmailVerified = 'Verify business email';
    if (!formData.businessPhoneVerified) newErrors.businessPhoneVerified = 'Verify business phone';
    if (!formData.legalBusinessName.trim()) newErrors.legalBusinessName = 'Required';
    if (!formData.businessType) newErrors.businessType = 'Required';
    if (!formData.category) newErrors.category = 'Required';
    if (!formData.businessModel) newErrors.businessModel = 'Required';
    if (!formData.street.trim()) newErrors.street = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';
    if (!formData.state.trim()) newErrors.state = 'Required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Required';

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
      // Save Step 2 data to DB
      const response = await apiClient.saveDesignerOnboardingStep2({
        legal_business_name: formData.legalBusinessName,
        business_type: formData.businessType,
        business_model: formData.businessModel,
        business_category: formData.category,
        business_sub_category: formData.subcategory,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: formData.country,
        studio_email: formData.businessEmail,
        studio_mobile_number: formData.businessPhone,
        gst_number: formData.gstNumber || undefined,
        msme_udyam_number: formData.msmeNumber || undefined,
        msme_certificate_annexure: formData.msmeAnnexure || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        setIsLoading(false);
        return;
      }

      toast.success('Step 2 data saved successfully');
      onComplete(formData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Step 2 data');
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
        <div className="space-y-6">
          <div>
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Basic Profile
            </Button>
            <h2 className="text-2xl font-bold mb-2">Business Details</h2>
            <p className="text-sm text-muted-foreground">
              Complete your business information to proceed.
            </p>
          </div>

          <div className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Business Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="legalBusinessName">Legal Business Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="legalBusinessName"
                    value={formData.legalBusinessName}
                    onChange={(e) => setFormData({ ...formData, legalBusinessName: e.target.value })}
                    placeholder="ABC Design Studio Pvt Ltd"
                  />
                  {errors.legalBusinessName && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.legalBusinessName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type <span className="text-destructive">*</span></Label>
                  <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessType && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.businessType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessModel">Business Model <span className="text-destructive">*</span></Label>
                  <Select value={formData.businessModel} onValueChange={(value) => setFormData({ ...formData, businessModel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessModels.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessModel && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.businessModel}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Business Category <span className="text-destructive">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Business Subcategory</Label>
                  <Select value={formData.subcategory} onValueChange={(value) => setFormData({ ...formData, subcategory: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>{subcat.charAt(0).toUpperCase() + subcat.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>
              </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Business Address</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="123 Design Street"
                    />
                    {errors.street && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.street}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Maharashtra"
                    />
                    {errors.state && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.state}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code <span className="text-destructive">*</span></Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="400001"
                    />
                    {errors.postalCode && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.postalCode}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="India"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Business Contact Details</h3>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="businessEmail"
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, businessEmail: e.target.value, businessEmailVerified: false });
                        setUsePersonalEmail(false);
                        const newErrors = { ...errors };
                        delete newErrors.businessEmail;
                        setErrors(newErrors);
                      }}
                      placeholder="business@company.com"
                      disabled={formData.businessEmailVerified || usePersonalEmail}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUsePersonalEmail}
                    disabled={formData.businessEmailVerified || usePersonalEmail}
                  >
                    {usePersonalEmail ? 'Using Personal' : 'Use Personal'}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.businessEmailVerified ? "outline" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendEmailOTP();
                    }}
                    disabled={formData.businessEmailVerified || !formData.businessEmail}
                  >
                    {formData.businessEmailVerified ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                {errors.businessEmail && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.businessEmail}
                  </p>
                )}
                {errors.businessEmailVerified && !formData.businessEmailVerified && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                    {errors.businessEmailVerified}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Mobile Number <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="businessPhone"
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => {
                        setFormData({ ...formData, businessPhone: e.target.value, businessPhoneVerified: false });
                        setUsePersonalPhone(false);
                        const newErrors = { ...errors };
                        delete newErrors.businessPhone;
                        setErrors(newErrors);
                      }}
                      placeholder="9876543210"
                      disabled={formData.businessPhoneVerified || usePersonalPhone}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUsePersonalPhone}
                    disabled={formData.businessPhoneVerified || usePersonalPhone}
                  >
                    {usePersonalPhone ? 'Using Personal' : 'Use Personal'}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.businessPhoneVerified ? "outline" : "default"}
                    size="sm"
                    onClick={handleSendPhoneOTP}
                    disabled={formData.businessPhoneVerified || !formData.businessPhone}
                  >
                    {formData.businessPhoneVerified ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                  </div>
                {errors.businessPhone && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.businessPhone}
                    </p>
                  )}
                {errors.businessPhoneVerified && !formData.businessPhoneVerified && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                    {errors.businessPhoneVerified}
                    </p>
                  )}
              </div>
                </div>

            {/* MSME and GST */}
            <div className="space-y-4">
              <h3 className="font-semibold">Additional Information (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="msmeNumber">MSME Udyam Number</Label>
                  <Input
                    id="msmeNumber"
                    value={formData.msmeNumber}
                    onChange={(e) => setFormData({ ...formData, msmeNumber: e.target.value })}
                    placeholder="UDYAM-XX-00-0000000"
                  />
                </div>

                {formData.msmeNumber && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="msmeAnnexure">MSME Certificate Annexure</Label>
                    {formData.msmeAnnexureUrl && !formData.msmeAnnexure && (
                      <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            MSME certificate already uploaded. Upload a new file to replace it.
                          </p>
                        </div>
                        {formData.msmeAnnexureUrl && (
                          <a 
                            href={formData.msmeAnnexureUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
                          >
                            View uploaded MSME certificate
                          </a>
                        )}
                      </div>
                    )}
                    <div className="relative">
                      <Input
                        id="msmeAnnexure"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                      {(formData.msmeAnnexure || formData.msmeAnnexureUrl) && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {formData.msmeAnnexure && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {formData.msmeAnnexure.name}
                      </p>
                    )}
                    {formData.msmeAnnexureUrl && !formData.msmeAnnexure && (
                      <p className="text-xs text-muted-foreground">
                        Previously uploaded certificate is saved
                      </p>
                    )}
                    {errors.msmeAnnexure && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.msmeAnnexure}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
              disabled={!formData.businessEmailVerified || !formData.businessPhoneVerified || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Next: Legal Info →'
              )}
                      </Button>
                </div>

          {(!formData.businessEmailVerified || !formData.businessPhoneVerified) && (
            <p className="text-xs text-muted-foreground text-center">
              Please verify business email and phone to continue
              </p>
            )}
        </div>
      </Card>

      <OTPVerificationModal
        open={showEmailOTP}
        onClose={() => setShowEmailOTP(false)}
        onVerified={handleEmailVerified}
        onResend={sendEmailOTP}
        type="email"
        value={formData.businessEmail}
      />

      <OTPVerificationModal
        open={showPhoneOTP}
        onClose={() => setShowPhoneOTP(false)}
        onVerified={handlePhoneVerified}
        onResend={sendPhoneOTP}
        type="phone"
        value={formData.businessPhone}
      />
    </>
  );
}
