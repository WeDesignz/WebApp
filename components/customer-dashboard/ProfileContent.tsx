"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddressFormModal from "./AddressFormModal";

interface Address {
  id: number;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  address_type: 'home' | 'work' | 'other';
  is_postal: boolean;
  is_permanent: boolean;
  created_at: string;
}

export default function ProfileContent() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    dateOfBirth: "",
    bio: "",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // Fetch user profile with bio and mobile number
  const { data: userProfileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await apiClient.getUserProfile();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  // Load profile image from user profile
  useEffect(() => {
    if (userProfileData?.profile_photo_url) {
      setProfileImage(userProfileData.profile_photo_url);
    }
  }, [userProfileData]);

  // Fetch designer profile for bio
  const { data: designerProfileData } = useQuery({
    queryKey: ['designerProfile'],
    queryFn: async () => {
      const response = await apiClient.getDesignerProfile();
      if (response.error) {
        // Designer profile might not exist for customers, that's okay
        return null;
      }
      return response.data?.designer_profile;
    },
    staleTime: 30 * 1000,
  });

  // Fetch addresses
  const { data: addressesData, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await apiClient.getAddresses();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.addresses || [];
    },
    staleTime: 30 * 1000,
  });

  const addresses: Address[] = addressesData || [];

  // Load initial values from user profile and designer profile
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (designerProfileData) {
      // Format date_of_birth for date input (YYYY-MM-DD)
      let formattedDate = "";
      if (designerProfileData.date_of_birth) {
        const date = new Date(designerProfileData.date_of_birth);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      }
      setFormData((prev) => ({
        ...prev,
        bio: designerProfileData.bio || "",
        dateOfBirth: formattedDate,
      }));
    }
  }, [designerProfileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setProfilePhotoFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let photoResponse: any = null;
      
      // Upload profile photo if changed
      if (profilePhotoFile) {
        photoResponse = await apiClient.uploadProfilePhoto(profilePhotoFile);
        if (photoResponse.error) {
          toast({
            title: "Photo upload failed",
            description: photoResponse.error || "Failed to upload profile photo",
            variant: "destructive",
          });
          // Continue with profile update even if photo upload fails
        } else {
          toast({
            title: "Photo uploaded",
            description: "Profile photo has been updated successfully.",
          });
          // Update profile image immediately if URL is returned
          if (photoResponse.data?.profile_photo_url) {
            setProfileImage(photoResponse.data.profile_photo_url);
          }
        }
      }
      
      // Update profile via API (without mobile_number)
      const response = await apiClient.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        date_of_birth: formData.dateOfBirth || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local user state
      const responseData = response.data as { user?: any; [key: string]: any } | undefined;
      if (responseData?.user && updateUser) {
        updateUser({
          ...user!,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['designerProfile'] });

      // Refresh profile image if photo was uploaded but URL wasn't in response
      if (profilePhotoFile && (!photoResponse?.data?.profile_photo_url)) {
        // Fallback: fetch profile again to get updated photo URL
        const profileResponse = await apiClient.getUserProfile();
        if (profileResponse.data?.profile_photo_url) {
          setProfileImage(profileResponse.data.profile_photo_url);
        }
      }

      setProfilePhotoFile(null);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Format date_of_birth for date input (YYYY-MM-DD)
    let formattedDate = "";
    if (designerProfileData?.date_of_birth) {
      const date = new Date(designerProfileData.date_of_birth);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    }
    
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      dateOfBirth: formattedDate,
      bio: designerProfileData?.bio || "",
    });
    setProfilePhotoFile(null);
    // Reset to original profile image if available
    if (userProfileData?.profile_photo_url) {
      setProfileImage(userProfileData.profile_photo_url);
    } else {
      setProfileImage(null);
    }
    setIsEditing(false);
  };

  const handleDeleteAddressClick = (addressId: number) => {
    setDeleteAddressId(addressId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddressId) return;

    try {
      const response = await apiClient.deleteAddress(deleteAddressId);
      if (response.error) {
        throw new Error(response.error);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Address deleted",
        description: "Address has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setDeleteAddressId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const openAddressModal = (address?: Address) => {
    setEditingAddress(address || null);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and preferences
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Personal Information</CardTitle>
                <CardDescription>
                  Update your profile details and personal information
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? (
                      <>
                        <Save className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {formData.firstName || user?.firstName || ''} {formData.lastName || user?.lastName || ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                  <p className="text-sm text-muted-foreground">@{formData.username || user?.username || ''}</p>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the camera icon to upload a new profile picture
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    disabled={true}
                    placeholder="System generated"
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">Username is system-generated and cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Management */}
        <EmailManagementSection />

        {/* Mobile Numbers Management */}
        <MobileNumbersSection />

        {/* Address Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Addresses</CardTitle>
                <CardDescription>Manage your shipping and billing addresses</CardDescription>
              </div>
              <Button onClick={() => openAddressModal()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingAddresses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an address to get started
                </p>
                <Button onClick={() => openAddressModal()} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Address
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <motion.div
                    key={address.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{address.address_line_1}</h3>
                          <Badge variant="secondary">{address.address_type}</Badge>
                          {address.is_permanent && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        {address.address_line_2 && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {address.address_line_2}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-sm text-muted-foreground">{address.country}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddressModal(address)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAddressClick(address.id)}
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

        {/* Security Settings */}
        <SecuritySection />

        {/* Address Form Modal */}
        <AddressFormModal
          isOpen={isAddressModalOpen}
          onClose={closeAddressModal}
          address={editingAddress}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['addresses'] });
            closeAddressModal();
          }}
        />

        {/* Delete Address Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Address</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this address? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteAddressId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAddress}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Security Section Component
function SecuritySection() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
      const response = await apiClient.changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      });

      if (response.error) {
        throw new Error(response.error || "Failed to change password");
      }

      // Check if response has error in data
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorMessage = typeof response.data.error === 'string' ? response.data.error : "Failed to change password";
        throw new Error(errorMessage);
      }

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

  return (
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
      </CardContent>
    </Card>
  );
}

// Email Management Section Component
interface Email {
  id: number;
  email: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

function EmailManagementSection() {
  const { user, sendEmailOTP } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = async () => {
    const trimmedEmail = newEmail.trim();
    
    if (!trimmedEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsAddingEmail(true);
    try {
      const response = await apiClient.addEmailAddress({
        email: trimmedEmail,
        is_primary: false,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // OTP will be sent automatically, show verification modal
      setVerifyingEmail(trimmedEmail);
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

  const handleDeleteEmail = async (emailId: number, email: string, isPrimary: boolean, isVerified: boolean) => {
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

    // Check if this is the only verified email
    if (isVerified) {
      const verifiedEmailsCount = emails.filter(e => e.is_verified).length;
      if (verifiedEmailsCount <= 1) {
        toast({
          title: "Cannot delete verified email",
          description: "At least one verified email must remain. Please verify another email first.",
          variant: "destructive",
        });
        return;
      }
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

  // Send OTP automatically when verification modal opens
  useEffect(() => {
    if (verifyingEmail) {
      const sendOTP = async () => {
        try {
          await sendEmailOTP(verifyingEmail);
          toast({
            title: "OTP sent",
            description: "An OTP has been sent to your email.",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to send OTP",
            variant: "destructive",
          });
        }
      };
      sendOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyingEmail]);

  return (
    <>
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
                      {!email.is_primary && email.is_verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(email.id)}
                        >
                          Set Primary
                        </Button>
                      )}
                      {!email.is_primary && !email.is_verified && (
                        <p className="text-xs text-muted-foreground">
                          Verify to set as primary
                        </p>
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
                        onClick={() => handleDeleteEmail(email.id, email.email, email.is_primary, email.is_verified)}
                        disabled={email.is_primary || emails.length <= 1 || (email.is_verified && emails.filter(e => e.is_verified).length <= 1)}
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
              <Label>OTP</Label>
              <OTPInput
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isVerifying}
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
    </>
  );
}

// Mobile Numbers Management Section Component
interface MobileNumber {
  id: number;
  mobile_number: string;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
}

function MobileNumbersSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [verifyingMobile, setVerifyingMobile] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [newMobileNumber, setNewMobileNumber] = useState("");
  const [isAddingMobile, setIsAddingMobile] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch mobile numbers from user profile
  const { data: userProfileData, isLoading: isLoadingMobiles } = useQuery({
    queryKey: ['userProfile', 'mobileNumbers'],
    queryFn: async () => {
      const response = await apiClient.getUserProfile();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const mobileNumbers: MobileNumber[] = userProfileData?.mobile_numbers || [];

  // Mobile number validation function
  const validateMobileNumber = (mobile: string): boolean => {
    // Remove any non-digit characters
    const digitsOnly = mobile.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return digitsOnly.length === 10;
  };

  const handleAddMobileNumber = async () => {
    const trimmedMobile = newMobileNumber.trim();
    
    if (!trimmedMobile) {
      toast({
        title: "Validation Error",
        description: "Please enter a mobile number",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number format (10 digits)
    if (!validateMobileNumber(trimmedMobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsAddingMobile(true);
    try {
      const response = await apiClient.addMobileNumber({
        mobile_number: trimmedMobile,
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      // Check if response has error in data
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorMsg = typeof response.data.error === 'string' ? response.data.error : 'Failed to add mobile number';
        throw new Error(errorMsg);
      }

      // Show verification modal immediately (demo mode - no SMS sent)
      setVerifyingMobile(trimmedMobile);
      setNewMobileNumber("");
      setIsMobileModalOpen(false);
      
      toast({
        title: "Mobile number added",
        description: "Please verify your mobile number with the OTP.",
      });

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    } catch (error: any) {
      // Extract error message from response - check multiple possible locations
      let errorMessage = "Failed to add mobile number";
      
      // Check response.error first (from apiRequest)
      if (error?.error) {
        errorMessage = error.error;
      } 
      // Check response.data.error (if error is in data)
      else if (error?.data?.error) {
        errorMessage = error.data.error;
      }
      // Check for field-specific errors (e.g., mobile_number validation)
      else if (error?.data?.errors) {
        const errors = error.data.errors;
        // Get first error from any field
        for (const field in errors) {
          if (Array.isArray(errors[field]) && errors[field].length > 0) {
            errorMessage = errors[field][0];
            break;
          } else if (errors[field]) {
            errorMessage = String(errors[field]);
            break;
          }
        }
      }
      // Check error.message (standard Error object)
      else if (error?.message) {
        errorMessage = error.message;
      }
      // Check errorDetails.message
      else if (error?.errorDetails?.message) {
        errorMessage = error.errorDetails.message;
      }
      // Check if error is a string
      else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingMobile(false);
    }
  };

  const handleVerifyMobileNumber = async () => {
    if (!verifyingMobile || !otp.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiClient.verifyMobileNumber({
        mobile_number: verifyingMobile,
        otp: otp.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Mobile number verified",
        description: "Your mobile number has been verified successfully.",
      });

      setVerifyingMobile(null);
      setOtp("");
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please use 123456 for demo.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPrimaryMobile = async (mobileId: number) => {
    try {
      const response = await apiClient.updateMobileNumber(mobileId, {
        is_primary: true,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Primary mobile number updated",
        description: "Primary mobile number has been updated successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set primary mobile number",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMobileNumber = async (mobileId: number, mobileNumber: string, isPrimary: boolean, isVerified: boolean) => {
    if (isPrimary) {
      toast({
        title: "Cannot delete primary mobile number",
        description: "Please set another mobile number as primary before deleting this one.",
        variant: "destructive",
      });
      return;
    }

    if (mobileNumbers.length <= 1) {
      toast({
        title: "Cannot delete last mobile number",
        description: "You must have at least one mobile number.",
        variant: "destructive",
      });
      return;
    }

    // Check if this is the only verified mobile number
    if (isVerified) {
      const verifiedMobilesCount = mobileNumbers.filter(m => m.is_verified).length;
      if (verifiedMobilesCount <= 1) {
        toast({
          title: "Cannot delete verified mobile number",
          description: "At least one verified mobile number must remain. Please verify another mobile number first.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!confirm(`Are you sure you want to delete ${mobileNumber}?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteMobileNumber(mobileId);
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Mobile number deleted",
        description: "Mobile number has been deleted successfully.",
      });

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete mobile number",
        variant: "destructive",
      });
    }
  };

  const handleResendOTP = async (mobileNumber: string) => {
    try {
      await apiClient.resendOTP({
        mobile_number: mobileNumber,
        otp_for: 'mobile_verification',
      });
      toast({
        title: "OTP sent",
        description: "A new OTP has been sent to your mobile number.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    }
  };

  // Send OTP automatically when verification modal opens (demo mode - show message)
  useEffect(() => {
    if (verifyingMobile) {
      // In demo mode, we don't actually send SMS, but we show a message
      toast({
        title: "Demo Mode",
        description: "Use OTP 123456 to verify your mobile number.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyingMobile]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">Mobile Numbers</CardTitle>
                <CardDescription>
                  Manage your mobile numbers and verification status
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setIsMobileModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Mobile Number
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingMobiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : mobileNumbers.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No mobile numbers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a mobile number to get started
              </p>
              <Button onClick={() => setIsMobileModalOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Mobile Number
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mobileNumbers.map((mobile) => (
                <motion.div
                  key={mobile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{mobile.mobile_number}</p>
                        {mobile.is_primary && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Primary
                          </Badge>
                        )}
                        {mobile.is_verified ? (
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
                        Added {new Date(mobile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!mobile.is_primary && mobile.is_verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimaryMobile(mobile.id)}
                        >
                          Set Primary
                        </Button>
                      )}
                      {!mobile.is_primary && !mobile.is_verified && (
                        <p className="text-xs text-muted-foreground">
                          Verify to set as primary
                        </p>
                      )}
                      {!mobile.is_verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setVerifyingMobile(mobile.mobile_number);
                            setOtp("");
                          }}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMobileNumber(mobile.id, mobile.mobile_number, mobile.is_primary, mobile.is_verified)}
                        disabled={mobile.is_primary || mobileNumbers.length <= 1 || (mobile.is_verified && mobileNumbers.filter(m => m.is_verified).length <= 1)}
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

      {/* Add Mobile Number Modal */}
      <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Mobile Number</DialogTitle>
            <DialogDescription>
              Add a new mobile number to your account. You'll need to verify it with an OTP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newMobileNumber">Mobile Number</Label>
              <Input
                id="newMobileNumber"
                type="tel"
                value={newMobileNumber}
                onChange={(e) => {
                  // Only allow digits
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewMobileNumber(digitsOnly);
                }}
                placeholder="1234567890"
              />
              <p className="text-xs text-muted-foreground">
                Enter a 10-digit mobile number
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMobileModalOpen(false);
                  setNewMobileNumber("");
                }}
                className="flex-1"
                disabled={isAddingMobile}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMobileNumber}
                className="flex-1"
                disabled={isAddingMobile || !newMobileNumber.trim()}
              >
                {isAddingMobile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Mobile Number"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify Mobile Number Modal */}
      <Dialog open={!!verifyingMobile} onOpenChange={() => setVerifyingMobile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Mobile Number</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP to verify your mobile number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit OTP sent to <strong>{verifyingMobile}</strong>
            </p>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Demo Mode:</strong> Use OTP <strong>123456</strong> to verify
              </p>
            </div>
            <div className="space-y-2">
              <Label>OTP</Label>
              <OTPInput
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isVerifying}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setVerifyingMobile(null);
                  setOtp("");
                }}
                className="flex-1"
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => verifyingMobile && handleResendOTP(verifyingMobile)}
                disabled={isVerifying}
              >
                <Send className="w-4 h-4 mr-2" />
                Resend
              </Button>
              <Button
                onClick={handleVerifyMobileNumber}
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
    </>
  );
}

