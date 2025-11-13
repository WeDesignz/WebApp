"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Save,
  Edit2,
  Check,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import OTPVerificationModal from "@/components/designer-onboarding/OTPVerificationModal";

interface DesignerProfile {
  id?: number;
  bio?: string;
  skill_tags?: string[];
  status?: string;
  media?: any[];
}

export default function ProfileContent() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.mobileNumber || "",
    bio: "",
    skillTags: [] as string[],
  });

  const [skillTagInput, setSkillTagInput] = useState("");

  // Fetch designer profile
  const { data: designerProfileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['designerProfile'],
    queryFn: async () => {
      const response = await apiClient.getDesignerProfile();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.designer_profile;
    },
    staleTime: 30 * 1000,
  });

  const designerProfile: DesignerProfile = designerProfileData || {};

  // Update profile data when user or designer profile changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.mobileNumber || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (designerProfile) {
      setProfileData(prev => ({
        ...prev,
        bio: designerProfile.bio || "",
        skillTags: designerProfile.skill_tags || [],
      }));
      
      // Set profile photo from media
      if (designerProfile.media && designerProfile.media.length > 0) {
        const profilePhoto = designerProfile.media.find((m: any) => m.media_type === 'image');
        if (profilePhoto?.file) {
          setPhotoPreview(profilePhoto.file);
        }
      }
    }
  }, [designerProfile]);

  // Update designer profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio?: string; skill_tags?: string[] }) => {
      const response = await apiClient.updateDesignerProfile(data);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your designer profile has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['designerProfile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkillTag = () => {
    if (skillTagInput.trim() && !profileData.skillTags.includes(skillTagInput.trim())) {
      setProfileData(prev => ({
        ...prev,
        skillTags: [...prev.skillTags, skillTagInput.trim()],
      }));
      setSkillTagInput("");
    }
  };

  const handleRemoveSkillTag = (tag: string) => {
    setProfileData(prev => ({
      ...prev,
      skillTags: prev.skillTags.filter(t => t !== tag),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user profile (firstName, lastName) via AuthContext if available
      if (typeof updateUser === 'function' && (profileData.firstName !== user?.firstName || profileData.lastName !== user?.lastName)) {
        // Note: Email and phone updates should go through separate verification flows
        // For now, we'll only update designer profile
      }

      // Update designer profile
      await updateProfileMutation.mutateAsync({
        bio: profileData.bio,
        skill_tags: profileData.skillTags,
      });

      // TODO: Handle profile photo upload if photoFile is set
      // This would require a separate endpoint for media upload
      if (photoFile) {
        toast({
          title: "Photo upload",
          description: "Profile photo upload will be implemented with media upload endpoint.",
        });
      }
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.mobileNumber || "",
        bio: designerProfile?.bio || "",
        skillTags: designerProfile?.skill_tags || [],
      });
    }
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handleEmailVerified = () => {
    setShowEmailOTP(false);
    toast({
      title: "Email verified",
      description: "Your email has been verified successfully.",
    });
    // Refresh user data
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const handlePhoneVerified = () => {
    setShowPhoneOTP(false);
    toast({
      title: "Phone verified",
      description: "Your phone number has been verified successfully.",
    });
    // Refresh user data
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  };

  const emailVerified = user?.emailVerified || false;
  const phoneVerified = user?.mobileVerified || false;

  if (isLoadingProfile) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information and designer profile
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="lg">
              <Edit2 className="w-5 h-5 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} size="lg">
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                size="lg" 
                disabled={isSaving || updateProfileMutation.isPending}
              >
                {isSaving || updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={photoPreview || undefined} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-purple-600">
                    {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Recommended: Square image, at least 400x400 pixels. Max file size: 5MB
                </p>
                {isEditing && (
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email Address</Label>
                {emailVerified && (
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleChange}
                  disabled={true}
                  className="flex-1"
                />
                {isEditing && !emailVerified && (
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailOTP(true)}
                    size="sm"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone">Phone Number</Label>
                {phoneVerified && (
                  <div className="flex items-center gap-1 text-sm text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleChange}
                  disabled={true}
                  className="flex-1"
                />
                {isEditing && !phoneVerified && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPhoneOTP(true)}
                    size="sm"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Designer Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Designer Profile</CardTitle>
            <CardDescription>Your bio and skills as a designer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={4}
                placeholder="Tell us about yourself and your design expertise..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillTags">Skill Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="skillTags"
                  placeholder="Add a skill tag"
                  value={skillTagInput}
                  onChange={(e) => setSkillTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkillTag();
                    }
                  }}
                  disabled={!isEditing}
                />
                <Button
                  type="button"
                  onClick={handleAddSkillTag}
                  variant="outline"
                  disabled={!isEditing}
                >
                  Add
                </Button>
              </div>
              {profileData.skillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.skillTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {designerProfile?.status && (
              <div className="space-y-2">
                <Label>Profile Status</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      designerProfile.status === "verified"
                        ? "default"
                        : designerProfile.status === "suspended"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {designerProfile.status.charAt(0).toUpperCase() + designerProfile.status.slice(1)}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OTP Verification Modals */}
      <OTPVerificationModal
        open={showEmailOTP}
        onClose={() => setShowEmailOTP(false)}
        onVerified={handleEmailVerified}
        type="email"
        value={profileData.email}
      />

      <OTPVerificationModal
        open={showPhoneOTP}
        onClose={() => setShowPhoneOTP(false)}
        onVerified={handlePhoneVerified}
        type="phone"
        value={profileData.phone}
      />
    </div>
  );
}
