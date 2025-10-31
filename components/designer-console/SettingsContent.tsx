"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Lock,
  Upload,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Camera,
  Save,
  RefreshCw,
  FileText,
  CreditCard,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import OTPVerificationModal from "@/components/designer-onboarding/OTPVerificationModal";
import { toast } from "sonner";

type RazorpayStatus = "not_created" | "pending" | "verified" | "rejected";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto: string | null;
}

interface BusinessData {
  studioEmail: string;
  studioPhone: string;
  legalBusinessName: string;
  businessType: string;
  panNumber: string;
  gstNumber: string;
  razorpayStatus: RazorpayStatus;
  razorpayRejectionReason?: string;
}

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "9876543210",
    profilePhoto: null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(true);

  // Business state
  const [businessData, setBusinessData] = useState<BusinessData>({
    studioEmail: "studio@example.com",
    studioPhone: "9123456789",
    legalBusinessName: "John Doe Design Studio",
    businessType: "Proprietorship",
    panNumber: "ABCDE1234F",
    gstNumber: "27ABCDE1234F1Z5",
    razorpayStatus: "pending", // Can be: not_created, pending, verified, rejected
    razorpayRejectionReason: undefined,
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
      setProfileData(prev => ({ ...prev, profilePhoto: reader.result as string }));
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleEmailVerified = () => {
    setEmailVerified(true);
    setShowEmailOTP(false);
    toast.success("Email verified successfully");
  };

  const handlePhoneVerified = () => {
    setPhoneVerified(true);
    setShowPhoneOTP(false);
    toast.success("Phone verified successfully");
  };

  const handleRetryRazorpay = () => {
    setBusinessData(prev => ({ ...prev, razorpayStatus: "pending", razorpayRejectionReason: undefined }));
    toast.success("Re-verification request submitted. Our team will review within 24-48 hours.");
  };

  const renderRazorpayStatusUI = () => {
    const { razorpayStatus, razorpayRejectionReason } = businessData;

    const statusConfig = {
      not_created: {
        icon: <AlertCircle className="w-12 h-12 text-yellow-500" />,
        title: "Linked Account Not Created",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
        textColor: "text-yellow-500",
      },
      pending: {
        icon: <Clock className="w-12 h-12 text-blue-500" />,
        title: "Verification Pending",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-500",
      },
      verified: {
        icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
        title: "Account Verified",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
        textColor: "text-green-500",
      },
      rejected: {
        icon: <XCircle className="w-12 h-12 text-red-500" />,
        title: "Verification Rejected",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        textColor: "text-red-500",
      },
    };

    const config = statusConfig[razorpayStatus];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-2 ${config.borderColor} ${config.bgColor} rounded-2xl p-8 mb-6`}
      >
        <div className="flex items-start gap-6">
          <div className={`p-4 rounded-2xl ${config.bgColor} border ${config.borderColor}`}>
            {config.icon}
          </div>

          <div className="flex-1">
            <h3 className={`text-2xl font-bold mb-2 ${config.textColor}`}>
              {config.title}
            </h3>

            {razorpayStatus === "not_created" && (
              <>
                <p className="text-muted-foreground mb-4">
                  You haven't created a Razorpay linked account yet. Complete the onboarding process to enable payouts.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Payouts are disabled until account is created
                  </p>
                </div>
              </>
            )}

            {razorpayStatus === "pending" && (
              <>
                <p className="text-muted-foreground mb-4">
                  Your Razorpay linked account is under verification. This usually takes 24-48 hours.
                </p>
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Expected Action Items
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Document verification in progress</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Bank account validation pending</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>KYC verification with Razorpay</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">ETA:</span> 24-48 hours from submission
                    </span>
                  </div>
                </div>
              </>
            )}

            {razorpayStatus === "verified" && (
              <>
                <p className="text-muted-foreground mb-4">
                  Your Razorpay linked account has been successfully verified! You can now receive payouts seamlessly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Account Status</span>
                    </div>
                    <p className="font-semibold text-green-500">Active</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Payouts</span>
                    </div>
                    <p className="font-semibold text-blue-500">Enabled</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Verification</span>
                    </div>
                    <p className="font-semibold text-purple-500">Completed</p>
                  </div>
                </div>
              </>
            )}

            {razorpayStatus === "rejected" && (
              <>
                <p className="text-muted-foreground mb-4">
                  Unfortunately, your account verification was rejected. Please review the feedback below and retry.
                </p>
                
                <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">Rejection Reason</h4>
                      <p className="text-sm text-muted-foreground">
                        {razorpayRejectionReason || "Invalid business details. Please check your PAN and business information."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Step-by-Step Corrections
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Verify that your PAN number matches your legal name exactly</li>
                    <li>Ensure all business documents are clear and readable</li>
                    <li>Double-check that bank account details are accurate</li>
                    <li>Make sure your business email and phone are verified</li>
                    <li>Review all fields below and update any incorrect information</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleRetryRazorpay}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Verification
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="w-4 h-4" />
            Business & Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            
            {/* Profile Photo */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Profile Photo</Label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-border overflow-hidden bg-muted">
                    {(photoPreview || profileData.profilePhoto) ? (
                      <img 
                        src={photoPreview || profileData.profilePhoto || ''} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Upload a professional photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium mb-2 block">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-sm font-medium mb-2 block">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Email with Re-verify */}
            <div className="mb-4">
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, email: e.target.value }));
                      setEmailVerified(false);
                    }}
                    className="pl-10"
                    placeholder="your@email.com"
                  />
                </div>
                {emailVerified ? (
                  <div className="flex items-center gap-2 px-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">Verified</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowEmailOTP(true)}
                    variant="outline"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Shield className="w-4 h-4" />
                    Re-verify
                  </Button>
                )}
              </div>
            </div>

            {/* Phone with Re-verify */}
            <div className="mb-6">
              <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, phone: e.target.value }));
                      setPhoneVerified(false);
                    }}
                    className="pl-10"
                    placeholder="9876543210"
                  />
                </div>
                {phoneVerified ? (
                  <div className="flex items-center gap-2 px-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">Verified</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowPhoneOTP(true)}
                    variant="outline"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Shield className="w-4 h-4" />
                    Re-verify
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </motion.div>

          {/* Password Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Password & Security
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Update your password to keep your account secure
            </p>

            <Button variant="outline" className="gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </motion.div>
        </TabsContent>

        {/* Business & Linked Account Tab */}
        <TabsContent value="business" className="space-y-6">
          {/* Razorpay Status UI */}
          {renderRazorpayStatusUI()}

          {/* Business Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>

            <div className="space-y-4">
              {/* Studio Email */}
              <div>
                <Label htmlFor="studioEmail" className="text-sm font-medium mb-2 block">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="studioEmail"
                    type="email"
                    value={businessData.studioEmail}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, studioEmail: e.target.value }))}
                    className="pl-10"
                    placeholder="business@example.com"
                  />
                </div>
              </div>

              {/* Studio Phone */}
              <div>
                <Label htmlFor="studioPhone" className="text-sm font-medium mb-2 block">
                  Business Phone <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="studioPhone"
                    value={businessData.studioPhone}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, studioPhone: e.target.value }))}
                    className="pl-10"
                    placeholder="9123456789"
                  />
                </div>
              </div>

              {/* Legal Business Name */}
              <div>
                <Label htmlFor="legalBusinessName" className="text-sm font-medium mb-2 block">
                  Legal Business Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="legalBusinessName"
                    value={businessData.legalBusinessName}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, legalBusinessName: e.target.value }))}
                    className="pl-10"
                    placeholder="Your Business Name"
                  />
                </div>
              </div>

              {/* Business Type (readonly) */}
              <div>
                <Label htmlFor="businessType" className="text-sm font-medium mb-2 block">
                  Business Type
                </Label>
                <Input
                  id="businessType"
                  value={businessData.businessType}
                  readOnly
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to change business type
                </p>
              </div>

              <Separator className="my-4" />

              {/* PAN Number */}
              <div>
                <Label htmlFor="panNumber" className="text-sm font-medium mb-2 block">
                  PAN Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="panNumber"
                  value={businessData.panNumber}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>

              {/* GST Number (optional) */}
              <div>
                <Label htmlFor="gstNumber" className="text-sm font-medium mb-2 block">
                  GST Number (Optional)
                </Label>
                <Input
                  id="gstNumber"
                  value={businessData.gstNumber}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Business Details
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* OTP Modals */}
      <OTPVerificationModal
        open={showEmailOTP}
        onClose={() => setShowEmailOTP(false)}
        type="email"
        value={profileData.email}
        onVerified={handleEmailVerified}
      />

      <OTPVerificationModal
        open={showPhoneOTP}
        onClose={() => setShowPhoneOTP(false)}
        type="phone"
        value={profileData.phone}
        onVerified={handlePhoneVerified}
      />
    </div>
  );
}
