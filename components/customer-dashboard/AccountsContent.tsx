"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Bell,
  CreditCard,
  Smartphone,
  Mail,
  Key,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Plus,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Email {
  id: number;
  email: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

export default function AccountsContent() {
  const { user, sendEmailOTP } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch email addresses
  const { data: emailsData, isLoading: isLoadingEmails } = useQuery({
    queryKey: ['emails'],
    queryFn: async () => {
      const response = await apiClient.listEmailAddresses();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.emails || [];
    },
    staleTime: 30 * 1000,
  });

  const emails: Email[] = emailsData || [];

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: false,
    securityAlerts: true,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState([
    { provider: "Google", connected: true, email: user?.email || "" },
    { provider: "Facebook", connected: false, email: "" },
  ]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // TODO: Implement API call to change password
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsAddingEmail(true);
    try {
      const response = await apiClient.addEmailAddress({
        email: newEmail.trim(),
        is_primary: false,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // OTP will be sent automatically, show verification modal
      setVerifyingEmail(newEmail.trim());
      setNewEmail("");
      setIsEmailModalOpen(false);
      
      toast({
        title: "Email added",
        description: "Please verify your email with the OTP sent to your inbox.",
      });

      await queryClient.invalidateQueries({ queryKey: ['emails'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add email address",
        variant: "destructive",
      });
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verifyingEmail || !otp.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiClient.verifyEmailAddress({
        email: verifyingEmail,
        otp: otp.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Email verified",
        description: "Your email has been verified successfully.",
      });

      setVerifyingEmail(null);
      setOtp("");
      await queryClient.invalidateQueries({ queryKey: ['emails'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPrimary = async (emailId: number) => {
    try {
      const response = await apiClient.updateEmailAddress(emailId, {
        is_primary: true,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Primary email updated",
        description: "Primary email has been updated successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ['emails'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set primary email",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmail = async (emailId: number, email: string, isPrimary: boolean) => {
    if (isPrimary) {
      toast({
        title: "Cannot delete primary email",
        description: "Please set another email as primary before deleting this one.",
        variant: "destructive",
      });
      return;
    }

    if (emails.length <= 1) {
      toast({
        title: "Cannot delete last email",
        description: "You must have at least one email address.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${email}?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteEmailAddress(emailId);
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Email deleted",
        description: "Email address has been deleted successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ['emails'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email address",
        variant: "destructive",
      });
    }
  };

  const handleResendOTP = async (email: string) => {
    try {
      await sendEmailOTP(email);
      toast({
        title: "OTP sent",
        description: "A new OTP has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    }
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast({
      title: twoFactorEnabled
        ? "Two-factor authentication disabled"
        : "Two-factor authentication enabled",
      description: twoFactorEnabled
        ? "Your account is now less secure"
        : "Your account is now more secure",
    });
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      // TODO: Implement account deletion
      toast({
        title: "Account deletion",
        description: "Account deletion is not yet implemented",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account security, preferences, and connected services
          </p>
        </div>

        {/* Security Settings */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-primary/20">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Change Password</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                >
                  {isChangingPassword ? (
                    <>
                      <Lock className="w-4 h-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                />
              </div>
              {twoFactorEnabled && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Two-factor authentication is enabled
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={() => handleNotificationToggle("emailNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={() => handleNotificationToggle("pushNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-base font-medium">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={() => handleNotificationToggle("smsNotifications")}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">Notification Types</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Order Updates</Label>
                  <Switch
                    checked={notificationSettings.orderUpdates}
                    onCheckedChange={() => handleNotificationToggle("orderUpdates")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Promotional Emails</Label>
                  <Switch
                    checked={notificationSettings.promotionalEmails}
                    onCheckedChange={() => handleNotificationToggle("promotionalEmails")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Security Alerts</Label>
                  <Switch
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={() => handleNotificationToggle("securityAlerts")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Email Addresses</CardTitle>
                  <CardDescription>
                    Manage your email addresses and verification status
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => setIsEmailModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Email
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingEmails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No email addresses</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an email address to get started
                </p>
                <Button onClick={() => setIsEmailModalOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Email Address
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {emails.map((email) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{email.email}</p>
                          {email.is_primary && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Primary
                            </Badge>
                          )}
                          {email.is_verified ? (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              <Check className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(email.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!email.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(email.id)}
                          >
                            Set Primary
                          </Button>
                        )}
                        {!email.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVerifyingEmail(email.email);
                              setOtp("");
                            }}
                          >
                            Verify
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmail(email.id, email.email, email.is_primary)}
                          disabled={email.is_primary || emails.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">Connected Accounts</CardTitle>
                <CardDescription>
                  Manage your linked social media accounts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {linkedAccounts.map((account, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {account.provider === "Google" ? (
                      <Mail className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{account.provider}</p>
                    {account.connected && account.email && (
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {account.connected ? (
                    <>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button variant="default" size="sm">
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader className="bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <CardTitle className="text-2xl text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Email Modal */}
        <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Email Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setNewEmail("");
                  }}
                  className="flex-1"
                  disabled={isAddingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEmail}
                  className="flex-1"
                  disabled={isAddingEmail || !newEmail.trim()}
                >
                  {isAddingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Email"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verify Email Modal */}
        <Dialog open={!!verifyingEmail} onOpenChange={() => setVerifyingEmail(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Email Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit OTP sent to <strong>{verifyingEmail}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerifyingEmail(null);
                    setOtp("");
                  }}
                  className="flex-1"
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => verifyingEmail && handleResendOTP(verifyingEmail)}
                  disabled={isVerifying}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resend
                </Button>
                <Button
                  onClick={handleVerifyEmail}
                  className="flex-1"
                  disabled={isVerifying || otp.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

