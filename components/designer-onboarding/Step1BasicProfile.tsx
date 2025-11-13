"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, Eye, EyeOff, Camera, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profilePhoto: File | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface Step1BasicProfileProps {
  initialData: Step1Data;
  onComplete: (data: Step1Data) => void;
}

export default function Step1BasicProfile({ initialData, onComplete }: Step1BasicProfileProps) {
  const [formData, setFormData] = useState<Step1Data>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

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
    setFormData({ ...formData, profilePhoto: file });
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

  const handleSendEmailOTP = () => {
    if (!validateEmail(formData.email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }
    setShowEmailOTP(true);
    toast.success('OTP sent to your email');
  };

  const handleSendPhoneOTP = () => {
    if (!validatePhone(formData.phone)) {
      setErrors({ ...errors, phone: 'Please enter a valid 10-digit phone number' });
      return;
    }
    setShowPhoneOTP(true);
    toast.success('OTP sent to your phone');
  };

  const handleEmailVerified = () => {
    setFormData({ ...formData, emailVerified: true });
    setShowEmailOTP(false);
    toast.success('Email verified successfully!');
  };

  const handlePhoneVerified = () => {
    setFormData({ ...formData, phoneVerified: true });
    setShowPhoneOTP(false);
    toast.success('Phone verified successfully!');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address';
    if (!validatePhone(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!formData.emailVerified) newErrors.emailVerified = 'Please verify your email';
    if (!formData.phoneVerified) newErrors.phoneVerified = 'Please verify your phone';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.profilePhoto) newErrors.profilePhoto = 'Profile photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onComplete(formData);
    } else {
      toast.error('Please fix all errors before continuing');
    }
  };

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
                <li>• Use a strong, unique password</li>
                <li>• Keep your business details accurate</li>
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
                  onClick={handleSendEmailOTP}
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
              <Label htmlFor="phone">Business Phone <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={formData.password} />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
                disabled={!formData.emailVerified || !formData.phoneVerified}
              >
                Next: Business Details →
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
        type="email"
        value={formData.email}
      />

      <OTPVerificationModal
        open={showPhoneOTP}
        onClose={() => setShowPhoneOTP(false)}
        onVerified={handlePhoneVerified}
        type="phone"
        value={formData.phone}
      />
    </>
  );
}
