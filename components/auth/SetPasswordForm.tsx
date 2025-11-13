"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPassword } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const validatePassword = (password: string): string => {
    if (password.length < 8) return 'Must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Must contain lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Must contain uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Must contain a number';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    } else if (name === 'confirmPassword') {
      const error = value !== formData.password ? 'Passwords do not match' : '';
      setErrors(prev => ({ ...prev, confirmPassword: error }));
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

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    const passwordError = validatePassword(formData.password);
    const confirmError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : '';

    if (passwordError || confirmError) {
      setErrors({ password: passwordError, confirmPassword: confirmError });
      return;
    }

    setIsSubmitting(true);
    try {
      await setPassword(formData.email, formData.otp, formData.password, formData.confirmPassword);
      setPasswordSet(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {passwordSet ? (
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
                <h1 className="text-2xl font-bold">Password Set!</h1>
                <p className="text-muted-foreground">
                  Your password has been set successfully.
                  <br />
                  Redirecting to login...
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
                <p className="text-muted-foreground">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code *</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.otp}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData(prev => ({ ...prev, otp: value }));
                    }}
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit OTP sent to your email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
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
                      placeholder="Confirm new password"
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

                <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Password must contain:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      One lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${/(?=.*\d)/.test(formData.password) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      One number
                    </li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Password...
                    </>
                  ) : (
                    'Set Password'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
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

