"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Check, AlertCircle, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';

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
  panNumber: string;
  panDocument: File | null;
  gstNumber: string;
  msmeNumber: string;
  msmeAnnexure: File | null;
}

interface Step2BusinessDetailsProps {
  initialData: Step2Data;
  onBack: () => void;
  onComplete: (data: Step2Data) => void;
}

type RazorpayStatus = 'idle' | 'creating' | 'created' | 'pending' | 'verified' | 'rejected';

export default function Step2BusinessDetails({ initialData, onBack, onComplete }: Step2BusinessDetailsProps) {
  const [formData, setFormData] = useState<Step2Data>(initialData);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [razorpayStatus, setRazorpayStatus] = useState<RazorpayStatus>('idle');
  const [razorpayMessage, setRazorpayMessage] = useState('');

  const businessTypes = ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP'];
  const categories = ['UI/UX Design', 'Graphic Design', 'Web Design', 'Illustration', 'Branding', 'Motion Graphics'];
  const businessModels = ['Freelancer', 'Agency', 'Studio', 'Consultancy'];

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
  };

  const validatePAN = (pan: string) => {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(pan);
  };

  const handleSendEmailOTP = () => {
    if (!validateEmail(formData.businessEmail)) {
      setErrors({ ...errors, businessEmail: 'Please enter a valid email address' });
      return;
    }
    setShowEmailOTP(true);
    toast.success('OTP sent to your business email');
  };

  const handleSendPhoneOTP = () => {
    if (!validatePhone(formData.businessPhone)) {
      setErrors({ ...errors, businessPhone: 'Please enter a valid 10-digit phone number' });
      return;
    }
    setShowPhoneOTP(true);
    toast.success('OTP sent to your business phone');
  };

  const handleEmailVerified = () => {
    setFormData({ ...formData, businessEmailVerified: true });
    setShowEmailOTP(false);
    toast.success('Business email verified successfully!');
  };

  const handlePhoneVerified = () => {
    setFormData({ ...formData, businessPhoneVerified: true });
    setShowPhoneOTP(false);
    toast.success('Business phone verified successfully!');
  };

  const handleFileUpload = (field: 'panDocument' | 'msmeAnnexure', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, [field]: 'File size must be less than 10MB' });
        return;
      }
      setFormData({ ...formData, [field]: file });
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
      toast.success(`${field === 'panDocument' ? 'PAN' : 'MSME'} document uploaded`);
    }
  };

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
    if (!validatePAN(formData.panNumber)) newErrors.panNumber = 'Invalid PAN format';
    if (!formData.panDocument) newErrors.panDocument = 'PAN upload required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateLinkedAccount = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before creating linked account');
      return;
    }

    setRazorpayStatus('creating');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const randomOutcome = Math.random();
    if (randomOutcome > 0.7) {
      setRazorpayStatus('verified');
      setRazorpayMessage('Your Razorpay linked account has been created and verified! You can now receive payouts.');
      toast.success('Razorpay account verified!');
      onComplete(formData);
    } else if (randomOutcome > 0.3) {
      setRazorpayStatus('pending');
      setRazorpayMessage('Your Razorpay linked account has been created and is pending verification. This usually takes 24-48 hours. Your earnings will accumulate in your wallet until verification is complete.');
      toast.info('Account pending verification');
      onComplete(formData);
    } else {
      setRazorpayStatus('rejected');
      setRazorpayMessage('Account verification failed: Invalid business details. Please check your PAN and business information.');
      toast.error('Verification failed');
    }
  };

  const getStatusIcon = () => {
    switch (razorpayStatus) {
      case 'creating':
        return <Loader2 className="w-6 h-6 animate-spin text-primary" />;
      case 'verified':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Basic Profile
            </Button>
            <h2 className="text-2xl font-bold mb-2">Business & Razorpay Details</h2>
            <p className="text-sm text-muted-foreground">
              Complete your business information to enable payouts through Razorpay.
            </p>
          </div>

          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contact">Contact Details</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="legal">Legal Info</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="space-y-4 mt-6">
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
                        const newErrors = { ...errors };
                        delete newErrors.businessEmail;
                        setErrors(newErrors);
                      }}
                      placeholder="business@company.com"
                      disabled={formData.businessEmailVerified}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={formData.businessEmailVerified ? "outline" : "default"}
                    size="sm"
                    onClick={handleSendEmailOTP}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="businessPhone"
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => {
                        setFormData({ ...formData, businessPhone: e.target.value, businessPhoneVerified: false });
                        const newErrors = { ...errors };
                        delete newErrors.businessPhone;
                        setErrors(newErrors);
                      }}
                      placeholder="9876543210"
                      disabled={formData.businessPhoneVerified}
                    />
                  </div>
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
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Note:</strong> Business contact details must be verified separately from personal contact. This ensures proper communication for business transactions.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-6">
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
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                  <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g., Mobile App Design"
                  />
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
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-4">Business Address</h3>
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
                      disabled
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="legal" className="space-y-4 mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.panNumber && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.panNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panDocument">PAN Document Upload <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="panDocument"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('panDocument', e)}
                      className="cursor-pointer"
                    />
                    {formData.panDocument && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {formData.panDocument && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {formData.panDocument.name}
                    </p>
                  )}
                  {errors.panDocument && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.panDocument}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="msmeNumber">MSME Number (Optional)</Label>
                  <Input
                    id="msmeNumber"
                    value={formData.msmeNumber}
                    onChange={(e) => setFormData({ ...formData, msmeNumber: e.target.value })}
                    placeholder="UDYAM-XX-00-0000000"
                  />
                </div>

                {formData.msmeNumber && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="msmeAnnexure">MSME Annexure Upload</Label>
                    <div className="relative">
                      <Input
                        id="msmeAnnexure"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('msmeAnnexure', e)}
                        className="cursor-pointer"
                      />
                      {formData.msmeAnnexure && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {formData.msmeAnnexure && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {formData.msmeAnnexure.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Required:</strong> PAN is mandatory for all payouts. GST and MSME are optional but recommended for tax benefits.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-6">
            {razorpayStatus === 'idle' || razorpayStatus === 'rejected' ? (
              <Button
                onClick={handleCreateLinkedAccount}
                className="w-full"
                size="lg"
                disabled={!formData.businessEmailVerified || !formData.businessPhoneVerified}
              >
                Create Razorpay Linked Account
              </Button>
            ) : (
              <Card className={`p-6 border-2 ${
                razorpayStatus === 'verified' ? 'border-green-500 bg-green-500/5' :
                razorpayStatus === 'pending' ? 'border-yellow-500 bg-yellow-500/5' :
                'border-primary bg-primary/5'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {getStatusIcon()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {razorpayStatus === 'creating' && 'Creating Razorpay Linked Account...'}
                      {razorpayStatus === 'verified' && 'Account Verified ✓'}
                      {razorpayStatus === 'pending' && 'Account Pending Verification'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {razorpayMessage}
                    </p>
                    {razorpayStatus !== 'verified' && razorpayStatus !== 'creating' && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          <strong>Note:</strong> Payouts are disabled until verification is complete. Your earnings will accumulate in your Wallet.
                        </p>
                      </div>
                    )}
                    {razorpayStatus === 'verified' && (
                      <Button onClick={() => window.location.href = '/designer-console'} size="lg">
                        Go to Designer Console →
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {(!formData.businessEmailVerified || !formData.businessPhoneVerified) && razorpayStatus === 'idle' && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Please verify business email and phone to create Razorpay account
              </p>
            )}
          </div>
        </div>
      </Card>

      <OTPVerificationModal
        open={showEmailOTP}
        onClose={() => setShowEmailOTP(false)}
        onVerified={handleEmailVerified}
        type="email"
        value={formData.businessEmail}
      />

      <OTPVerificationModal
        open={showPhoneOTP}
        onClose={() => setShowPhoneOTP(false)}
        onVerified={handlePhoneVerified}
        type="phone"
        value={formData.businessPhone}
      />
    </>
  );
}
