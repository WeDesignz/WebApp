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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    email: user?.email || "",
    mobileNumber: user?.mobileNumber || "",
    username: user?.username || "",
    dateOfBirth: "",
    bio: "",
  });

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
    if (userProfileData) {
      const primaryMobile = userProfileData.mobile_numbers?.find((m: any) => m.is_primary);
      setFormData((prev) => ({
        ...prev,
        mobileNumber: primaryMobile?.mobile_number || user?.mobileNumber || "",
      }));
    }
  }, [userProfileData, user]);

  useEffect(() => {
    if (designerProfileData) {
      setFormData((prev) => ({
        ...prev,
        bio: designerProfileData.bio || "",
      }));
    }
  }, [designerProfileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      // Update profile via API
      const response = await apiClient.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        mobile_number: formData.mobileNumber,
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
          username: formData.username,
          mobileNumber: formData.mobileNumber,
        });
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['designerProfile'] });

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
    const primaryMobile = userProfileData?.mobile_numbers?.find((m: any) => m.is_primary);
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      mobileNumber: primaryMobile?.mobile_number || user?.mobileNumber || "",
      username: user?.username || "",
      dateOfBirth: "",
      bio: designerProfileData?.bio || "",
    });
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
                    {formData.firstName} {formData.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
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
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Choose a username"
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                  {user?.emailVerified && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Email verified
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                  {user?.mobileVerified && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Mobile verified
                    </p>
                  )}
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

