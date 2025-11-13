"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OTPVerificationModal from '@/components/auth/OTPVerificationModal';
import { toast } from 'sonner';

export default function RegisterForm() {
  const router = useRouter();
  const { register, sendEmailOTP, sendMobileOTP, verifyEmailOTP, verifyMobileOTP } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpModal, setOtpModal] = useState<{ type: 'email' | 'mobile'; isOpen: boolean }>({
    type: 'email',
    isOpen: false,
  });

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : '';
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email address' : '';
      case 'mobileNumber':
        return !/^\+?[\d\s-]{10,}$/.test(value) ? 'Invalid mobile number' : '';
      case 'password':
        if (value.length < 8) return 'Must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Must contain lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Must contain uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Must contain a number';
        return '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    if (name === 'email') setEmailVerified(false);
    if (name === 'mobileNumber') setMobileVerified(false);
  };


  const handleOTPVerify = async (otp: string): Promise<boolean> => {
    if (otpModal.type === 'email') {
      // Pass mobile number to verifyEmailOTP so it can be added after email verification
      const verified = await verifyEmailOTP(formData.email, otp, formData.mobileNumber);
      if (verified) {
        setEmailVerified(true);
        toast.success('Email verified successfully!');
        
        // After email verification, prompt for mobile verification if not done
        if (!mobileVerified && formData.mobileNumber) {
          setTimeout(() => {
            toast.info('Please verify your mobile number');
            setOtpModal({ type: 'mobile', isOpen: true });
          }, 1000);
        } else {
          // Email verified, no mobile or mobile already verified, redirect to home
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      }
      return verified;
    } else {
      const verified = await verifyMobileOTP(formData.mobileNumber, otp);
      if (verified) {
        setMobileVerified(true);
        toast.success('Mobile number verified successfully!');
        
        // Both verified, redirect to home
        if (emailVerified && mobileVerified) {
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          // Just mobile verified, redirect anyway
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      }
      return verified;
    }
  };

  const handleResendOTP = async () => {
    if (otpModal.type === 'email') {
      await sendEmailOTP(formData.email);
    } else {
      await sendMobileOTP(formData.mobileNumber);
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&#])/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    return { strength, label: labels[strength - 1] || '', color: colors[strength - 1] || '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Register user (this automatically sends email OTP)
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        emailVerified: false,
        mobileVerified: false,
      });
      
      // Step 2: Email OTP is sent automatically after signup, show modal
      toast.success('Account created! Please verify your email address.');
      setOtpModal({ type: 'email', isOpen: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err?.message || err?.error || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-muted-foreground">Join WeDesign and start creating</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? 'border-red-500' : emailVerified ? 'border-green-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
                {!errors.email && formData.email && (
                  <p className="text-xs text-muted-foreground">
                    You'll receive a verification code after creating your account
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number *</Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className={errors.mobileNumber ? 'border-red-500' : mobileVerified ? 'border-green-500' : ''}
                />
                {errors.mobileNumber && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.mobileNumber}
                  </p>
                )}
                {!errors.mobileNumber && formData.mobileNumber && (
                  <p className="text-xs text-muted-foreground">
                    You'll receive a verification code after creating your account
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && passwordStrength.strength > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              {(emailVerified || mobileVerified) && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {emailVerified && (
                    <p className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Email verified
                    </p>
                  )}
                  {mobileVerified && (
                    <p className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Mobile verified
                    </p>
                  )}
                </div>
              )}
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <OTPVerificationModal
        isOpen={otpModal.isOpen}
        onClose={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}
        type={otpModal.type}
        value={otpModal.type === 'email' ? formData.email : formData.mobileNumber}
        onVerify={handleOTPVerify}
        onResend={handleResendOTP}
      />
    </>
  );
}

