"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { OTPInput } from '@/components/ui/otp-input';
import { Loader2, Mail, CheckCircle2, ArrowLeft, MessageCircle, Phone, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

type Step = 'request' | 'verify-otp' | 'reset-password' | 'success';

export default function ResetPasswordForm() {
  const { resetPassword, setPassword } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  
  // Request OTP states
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentDeliveryMethod, setSentDeliveryMethod] = useState<'email' | 'whatsapp'>('email');
  const [sentPhoneNumber, setSentPhoneNumber] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  
  // OTP verification states
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // Password reset states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryMethod === 'email') {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }
    } else {
      if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await resetPassword(
        deliveryMethod === 'email' ? email : '', 
        deliveryMethod, 
        deliveryMethod === 'whatsapp' ? phoneNumber : undefined
      );
      setSentDeliveryMethod(deliveryMethod);
      setSentPhoneNumber(phoneNumber);
      setSentEmail(email);
      setStep('verify-otp');
      setOtp('');
      setOtpError('');
      toast.success(`Password reset OTP sent via ${deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}!`);
    } catch (err: any) {
      if (err.message?.includes('WhatsApp is not available') || err.message?.includes('verified mobile') || err.message?.includes('not found') || err.message?.includes('not linked')) {
        toast.error('This phone number is not linked to any account or is not verified. Please use email or verify your mobile number first.');
        setDeliveryMethod('email');
      } else {
        toast.error(err.message || 'Failed to send reset OTP');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setOtpError('');
    
    try {
      const payload: any = { otp };
      if (sentDeliveryMethod === 'email') {
        payload.email = sentEmail;
      } else {
        payload.phone_number = sentPhoneNumber;
      }
      
      const response = await apiClient.verifyPasswordResetOTP(payload);
      
      if (response.error) {
        // Extract error message from response
        const errorMessage = response.error || 'Invalid OTP. Please check the code and try again.';
        setOtpError(errorMessage);
        setOtp('');
        toast.error(errorMessage);
      } else {
        setStep('reset-password');
        setOtpError('');
        toast.success('OTP verified successfully!');
      }
    } catch (err: any) {
      // Handle any unexpected errors
      const errorMessage = err?.response?.data?.error || err?.error || err?.message || 'Invalid OTP. Please check the code and try again.';
      setOtpError(errorMessage);
      setOtp('');
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsResetting(true);
    try {
      await setPassword(
        sentDeliveryMethod === 'email' ? sentEmail : '',
        otp,
        newPassword,
        confirmPassword,
        sentDeliveryMethod === 'whatsapp' ? sentPhoneNumber : undefined
      );
      setStep('success');
      toast.success('Password reset successfully!');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Password Reset Successful!</h1>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
            </motion.div>
          ) : step === 'reset-password' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
                <p className="text-muted-foreground">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                    />
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isResetting}>
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('verify-otp');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to OTP
              </Button>
            </motion.div>
          ) : step === 'verify-otp' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {sentDeliveryMethod === 'whatsapp' ? 'Check Your WhatsApp' : 'Check Your Email'}
                </h1>
                <p className="text-muted-foreground">
                  We've sent a password reset OTP to
                  <br />
                  <span className="font-medium text-foreground">
                    {sentDeliveryMethod === 'whatsapp' ? `your WhatsApp (${sentPhoneNumber})` : sentEmail}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-center block">Enter OTP</Label>
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={isVerifying}
                    length={6}
                  />
                </div>

                {otpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{otpError}</span>
                  </motion.div>
                )}

                <Button
                  onClick={handleVerifyOTP}
                  className="w-full"
                  disabled={isVerifying || otp.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Verify OTP
                    </>
                  )}
                </Button>
              </div>

              <div className="text-sm text-center text-muted-foreground">
                Didn't receive the {sentDeliveryMethod === 'whatsapp' ? 'WhatsApp message' : 'email'}?{' '}
                <button
                  onClick={() => {
                    setStep('request');
                    setOtp('');
                    setOtpError('');
                    setDeliveryMethod(sentDeliveryMethod);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Resend OTP
                </button>
              </div>

              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
                <p className="text-muted-foreground">
                  {deliveryMethod === 'email' 
                    ? 'Enter your email to receive OTP'
                    : 'Enter your phone number to receive OTP via WhatsApp'}
                </p>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div className="space-y-2">
                  <Label>Send OTP via</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('email');
                        setPhoneNumber('');
                      }}
                      className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                        deliveryMethod === 'email'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Mail className="h-5 w-5" />
                      <span className="font-medium">Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('whatsapp');
                        setEmail('');
                      }}
                      className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
                        deliveryMethod === 'whatsapp'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-medium">WhatsApp</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {deliveryMethod === 'email' ? (
                    <>
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="pl-10"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Label htmlFor="phoneNumber">Phone Number (10 digits)</Label>
                      <div className="relative">
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={phoneNumber}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneNumber(value);
                          }}
                          placeholder="Enter 10-digit phone number"
                          className="pl-10"
                        />
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter the phone number linked to your account
                      </p>
                    </>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      {deliveryMethod === 'whatsapp' ? (
                        <>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Send OTP via WhatsApp
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send OTP via Email
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
