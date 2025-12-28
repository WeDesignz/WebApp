"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Smartphone } from 'lucide-react';

interface OTPVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (otp: string) => Promise<boolean> | boolean;
  onResend?: () => Promise<void> | void;
  type: 'email' | 'phone';
  value: string;
}

export default function OTPVerificationModal({ open, onClose, onVerified, onResend, type, value }: OTPVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      
      // Note: OTP is now sent before modal opens, so we don't auto-send here
      // onResend is only used for the "Resend OTP" button click
    }
  }, [open]);

  useEffect(() => {
    if (countdown > 0 && open) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, open]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await onVerified(otpValue);
      if (result) {
        onClose();
      } else {
        // Show error toast when verification returns false
        toast.error('Invalid OTP. Please check the code and try again.');
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      // Extract error message from various possible formats
      const errorMessage = error?.response?.data?.error || 
                          error?.error || 
                          error?.message || 
                          'Invalid OTP. Please check the code and try again.';
      toast.error(errorMessage);
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (onResend) {
      try {
        setIsSendingOTP(true);
        await Promise.resolve(onResend());
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } catch (error: any) {
        toast.error(error.message || 'Failed to resend OTP');
      } finally {
        setIsSendingOTP(false);
      }
    } else {
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      toast.success('OTP resent successfully');
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
            {type === 'email' ? (
              <Mail className="w-6 h-6 text-primary" />
            ) : (
              <Smartphone className="w-6 h-6 text-primary" />
            )}
          </div>
          <DialogTitle className="text-center">Verify Your {type === 'email' ? 'Email' : 'Phone'}</DialogTitle>
          <DialogDescription className="text-center">
            {isSendingOTP ? (
              <>
                Sending OTP to<br />
                <span className="font-semibold text-foreground">{value}</span>
              </>
            ) : (
              <>
                We&apos;ve sent a 6-digit code to<br />
                <span className="font-semibold text-foreground">{value}</span>
                {type === 'phone' && (
                  <><br /><span className="text-xs text-muted-foreground mt-2 block">via WhatsApp</span></>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold"
              />
            ))}
          </div>

          <div className="text-center">
            {canResend ? (
              <Button variant="ghost" onClick={handleResend} className="text-sm">
                Resend OTP
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend OTP in <span className="font-semibold text-foreground">{countdown}s</span>
              </p>
            )}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={otp.some(d => !d) || isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
