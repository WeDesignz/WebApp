"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Building2, 
  Edit2,
  Users,
  Search,
  Trash2,
  Loader2,
  Save,
  X,
  CheckCircle2,
  Calendar,
  Briefcase,
  Hash,
  FileText,
  Sparkles,
  UserPlus,
  Settings,
  Info,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Eye,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudioAccess } from "@/contexts/StudioAccessContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Studio {
  id: number;
  name: string;
  wedesignz_auto_name: string;
  studio_industry_type: string;
  status: string;
  daily_design_generation_capacity: number;
  remarks?: string;
  created_at: string;
}

interface StudioMember {
  id: number;
  member: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  role: 'design_lead' | 'designer';
  status: 'active' | 'inactive';
  created_at: string;
  created_by: {
    id: number;
    username: string;
  };
}

// Helper function to make absolute URL
const makeAbsoluteUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // If it's already a data URL or absolute URL, return as-is
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (!apiBaseUrl) {
    return url;
  }
  // Remove trailing slash from apiBaseUrl if present
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/${url}`;
};

// Helper function to check if a URL is a PDF
const isPDF = (url: string | null | undefined): boolean => {
  if (!url) return false;
  // Check if it's a data URL with PDF MIME type
  if (url.startsWith('data:')) {
    return url.toLowerCase().includes('application/pdf') || url.toLowerCase().includes('data:application/pdf');
  }
  // Check regular URLs
  const urlLower = url.toLowerCase();
  return urlLower.includes('.pdf') || urlLower.includes('application/pdf');
};

export default function StudioContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFullAccess, isStudioOwner } = useStudioAccess();
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [isEditingStudio, setIsEditingStudio] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [pdfLoadError, setPdfLoadError] = useState<boolean>(false);
  
  // Studio Members state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    role: 'designer' as 'design_lead' | 'designer',
  });
  const [createdMemberPassword, setCreatedMemberPassword] = useState<string | null>(null);
  const [createdMemberId, setCreatedMemberId] = useState<number | null>(null);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<StudioMember | null>(null);

  // Studio form state
  const [studioForm, setStudioForm] = useState({
    name: "",
    studio_industry_type: "design_studio",
    daily_design_generation_capacity: 0,
    remarks: "",
  });

  // Business details form state
  const [businessForm, setBusinessForm] = useState({
    legal_business_name: "",
    business_type: "individual",
    business_category: "ecommerce",
    business_sub_category: "residential",
    business_model: "",
    pan_number: "",
    gst_number: "",
    msme_udyam_number: "",
    registered_addresses_json: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India"
    },
    pan_card_file: null as File | null,
    msme_certificate_file: null as File | null,
    pan_card_preview: null as string | null,
    msme_certificate_preview: null as string | null,
  });

  // Fetch user's studios
  const { data: studiosData, isLoading: isLoadingStudios } = useQuery({
    queryKey: ['myStudios'],
    queryFn: async () => {
      const response = await apiClient.getMyStudios();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const studios: Studio[] = studiosData?.studios || [];

  // Auto-select first studio if available
  useEffect(() => {
    if (studios.length > 0 && !selectedStudioId) {
      setSelectedStudioId(studios[0].id);
    }
  }, [studios, selectedStudioId]);

  // Fetch selected studio details
  const { data: studioDetailData, isLoading: isLoadingStudioDetail } = useQuery({
    queryKey: ['studioDetail', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId) return null;
      const response = await apiClient.getStudioDetail(selectedStudioId);
      if (response.error) throw new Error(response.error);
      return response.data?.studio;
    },
    enabled: !!selectedStudioId,
    staleTime: 30 * 1000,
  });

  // Fetch studio business details
  const { data: businessDetailsData, isLoading: isLoadingBusinessDetails } = useQuery({
    queryKey: ['studioBusinessDetails', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId) return null;
      const response = await apiClient.getStudioBusinessDetails(selectedStudioId);
      if (response.error) throw new Error(response.error);
      return response.data?.business_details;
    },
    enabled: !!selectedStudioId,
    staleTime: 30 * 1000,
  });

  // Fetch studio members
  const { data: membersData, isLoading: isLoadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['studioMembers', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId) return null;
      const response = await apiClient.getStudioMembers(selectedStudioId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!selectedStudioId && hasFullAccess,
    staleTime: 30 * 1000,
  });

  const members: StudioMember[] = membersData?.members || [];
  const businessDetails = businessDetailsData;

  // Calculate stats
  const studioStats = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'active').length;
    const inactiveMembers = members.filter(m => m.status === 'inactive').length;
    const designLeads = members.filter(m => m.role === 'design_lead').length;
    return {
      totalMembers: members.length,
      activeMembers,
      inactiveMembers,
      designLeads,
      designers: members.filter(m => m.role === 'designer').length,
    };
  }, [members]);

  // Update studio mutation
  const updateStudioMutation = useMutation({
    mutationFn: async ({ studioId, data }: { studioId: number; data: any }) => {
      const response = await apiClient.updateStudio(studioId, data);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Studio updated",
        description: "Studio information has been updated successfully.",
        variant: "success",
      });
      setIsEditingStudio(false);
      queryClient.invalidateQueries({ queryKey: ['myStudios'] });
      queryClient.invalidateQueries({ queryKey: ['studioDetail', selectedStudioId] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update studio. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update business details mutation
  const updateBusinessDetailsMutation = useMutation({
    mutationFn: async ({ studioId, data }: { studioId: number; data: FormData | any }) => {
      const response = await apiClient.updateStudioBusinessDetails(studioId, data);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Business details updated",
        description: "Business details have been updated successfully.",
        variant: "success",
      });
      setIsEditingBusiness(false);
      queryClient.invalidateQueries({ queryKey: ['studioBusinessDetails', selectedStudioId] });
    },
    onError: (error: any) => {
      // Extract field errors from multiple possible locations
      const fieldErrors = 
        error?.errorDetails?.fieldErrors || 
        error?.errorDetails?.errors || 
        error?.errorDetails?.originalError?.errors ||
        error?.rawError?.errors ||
        error?.rawError ||
        {};
      
      // Build error message from field errors
      const errorMessages = Object.entries(fieldErrors)
        .filter(([key]) => key !== 'error' && key !== 'detail')
        .map(([field, messages]: [string, any]) => {
          const msg = Array.isArray(messages) ? messages.join(', ') : String(messages);
          return `${field}: ${msg}`;
        })
        .join('; ');
      
      toast({
        title: "Update failed",
        description: errorMessages || error.message || "Failed to update business details. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create studio member with user account mutation
  const createMemberMutation = useMutation({
    mutationFn: async ({ studioId, memberData }: { studioId: number; memberData: { email: string; password: string; confirm_password: string; first_name?: string; last_name?: string; role: 'design_lead' | 'designer' } }) => {
      const response = await apiClient.createStudioMemberWithUser(studioId, memberData);
      if (response.error) {
        // Preserve field errors and error details in the error object
        const error: any = new Error(response.error);
        error.errorDetails = response.errorDetails;
        error.fieldErrors = response.fieldErrors || response.errorDetails?.fieldErrors;
        throw error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Member created successfully",
        description: "Studio member account has been created.",
        variant: "success",
      });
      // Store password and member ID for sending credentials
      setCreatedMemberPassword(newMemberForm.password);
      setCreatedMemberId(data?.member?.id || null);
      // Reset form
      setNewMemberForm({
        email: "",
        password: "",
        confirm_password: "",
        first_name: "",
        last_name: "",
        role: 'designer',
      });
      refetchMembers();
    },
    onError: (error: any) => {
      // Extract field errors from error response
      const fieldErrors = error?.errorDetails?.fieldErrors || error?.fieldErrors;
      
      // Build error message from field errors or use default message
      let errorMessage = "Please check your input and try again.";
      
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        // Get the first field error message
        const firstField = Object.keys(fieldErrors)[0];
        const firstError = Array.isArray(fieldErrors[firstField]) 
          ? fieldErrors[firstField][0] 
          : fieldErrors[firstField];
        errorMessage = firstError || errorMessage;
      } else if (error?.errorDetails?.message) {
        errorMessage = error.errorDetails.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Send credentials mutation
  const sendCredentialsMutation = useMutation({
    mutationFn: async ({ studioId, memberId, password }: { studioId: number; memberId: number; password: string }) => {
      const response = await apiClient.sendStudioMemberCredentials(studioId, memberId, password);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Credentials sent",
        description: "Login credentials have been sent to the member's email.",
        variant: "success",
      });
      setCreatedMemberPassword(null);
      setCreatedMemberId(null);
      setShowAddMemberModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send credentials",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update studio member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ studioId, memberId, memberData }: { studioId: number; memberId: number; memberData: { role?: 'design_lead' | 'designer'; status?: 'active' | 'inactive' } }) => {
      const response = await apiClient.updateStudioMember(studioId, memberId, memberData);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Member updated",
        description: "Studio member has been updated successfully.",
        variant: "success",
      });
      refetchMembers();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove studio member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ studioId, memberId }: { studioId: number; memberId: number }) => {
      const response = await apiClient.removeStudioMember(studioId, memberId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "Studio member has been removed successfully.",
        variant: "success",
      });
      refetchMembers();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleUpdateStudio = () => {
    if (!selectedStudioId) return;
    updateStudioMutation.mutate({
      studioId: selectedStudioId,
      data: studioForm,
    });
  };

  const handleUpdateBusinessDetails = () => {
    if (!selectedStudioId) return;
    
    const formData = new FormData();
    formData.append('studio_id', selectedStudioId.toString());
    formData.append('legal_business_name', businessForm.legal_business_name || '');
    formData.append('business_type', businessForm.business_type);
    formData.append('business_category', businessForm.business_category);
    formData.append('business_sub_category', businessForm.business_sub_category);
    formData.append('business_model', businessForm.business_model || '');
    formData.append('pan_number', businessForm.pan_number || '');
    formData.append('gst_number', businessForm.gst_number || '');
    formData.append('msme_udyam_number', businessForm.msme_udyam_number || '');
    formData.append('registered_addresses_json', JSON.stringify(businessForm.registered_addresses_json || {}));
    
    // Include studio_email and studio_mobile_number (required for non-individual business types)
    // These fields are not editable but must be sent for validation
    if (businessDetails?.studio_email) {
      formData.append('studio_email', businessDetails.studio_email);
    }
    if (businessDetails?.studio_mobile_number) {
      formData.append('studio_mobile_number', businessDetails.studio_mobile_number);
    }
    
    if (businessForm.pan_card_file) {
      formData.append('pan_card', businessForm.pan_card_file);
    }
    if (businessForm.msme_certificate_file) {
      formData.append('msme_certificate_annexure', businessForm.msme_certificate_file);
    }

    updateBusinessDetailsMutation.mutate({
      studioId: selectedStudioId,
      data: formData,
    });
  };

  // Initialize business form when business details are loaded or when starting to edit
  useEffect(() => {
    if (isEditingBusiness && businessDetails) {
      setBusinessForm({
        legal_business_name: businessDetails.legal_business_name || "",
        business_type: businessDetails.business_type || "individual",
        business_category: businessDetails.business_category || "ecommerce",
        business_sub_category: businessDetails.business_sub_category || "residential",
        business_model: businessDetails.business_model || "",
        pan_number: businessDetails.pan_number || "",
        gst_number: businessDetails.gst_number || "",
        msme_udyam_number: businessDetails.msme_udyam_number || "",
        registered_addresses_json: businessDetails.registered_addresses_json || {
          street: "",
          city: "",
          state: "",
          postal_code: "",
          country: "India"
        },
        pan_card_file: null,
        msme_certificate_file: null,
        pan_card_preview: businessDetails.pan_card || null,
        msme_certificate_preview: businessDetails.msme_certificate_annexure || null,
      });
    } else if (isEditingBusiness && !businessDetails) {
      // Initialize empty form if no business details exist
      setBusinessForm({
        legal_business_name: "",
        business_type: "individual",
        business_category: "ecommerce",
        business_sub_category: "residential",
        business_model: "",
        pan_number: "",
        gst_number: "",
        msme_udyam_number: "",
        registered_addresses_json: {
          street: "",
          city: "",
          state: "",
          postal_code: "",
          country: "India"
        },
        pan_card_file: null,
        msme_certificate_file: null,
        pan_card_preview: null,
        msme_certificate_preview: null,
      });
    }
  }, [isEditingBusiness, businessDetails]);

  const selectedStudio = studios.find(s => s.id === selectedStudioId);

  // Redirect if not studio owner
  if (!isStudioOwner) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Studio Management</h3>
            <p className="text-muted-foreground">
              Studio management is only available for studio owners. If you're a studio member, you can upload designs but cannot manage studio settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            Studio Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your studio, members, and settings
          </p>
        </div>
      </div>

      {isLoadingStudios ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : studios.length === 0 ? (
        <Card className="border-dashed bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No Studio Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your studio should have been created during onboarding. If you don't see your studio, please contact support.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
            {selectedStudioId ? (
              <>
                {/* Hero Section with Studio Info */}
                {!isEditingStudio && studioDetailData && (
                  <Card className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                              <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl">{studioDetailData.name}</CardTitle>
                              <CardDescription className="mt-1 font-mono text-xs">
                                {studioDetailData.wedesignz_auto_name}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                          <Briefcase className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Industry</p>
                            <p className="text-sm font-semibold">
                              {studioDetailData.studio_industry_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                          <Hash className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Daily Capacity</p>
                            <p className="text-sm font-semibold">{studioDetailData.daily_design_generation_capacity} designs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                          <Calendar className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-semibold">
                              {format(new Date(studioDetailData.created_at || selectedStudio?.created_at || ''), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                      {studioDetailData.remarks && (
                        <div className="mt-4 p-3 rounded-lg bg-background/50">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                              <p className="text-sm">{studioDetailData.remarks}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Stats Cards */}
                {!isEditingStudio && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                            <p className="text-3xl font-bold">{studioStats.totalMembers}</p>
                          </div>
                          <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-7 h-7 text-blue-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Active Members</p>
                            <p className="text-3xl font-bold text-green-600">{studioStats.activeMembers}</p>
                          </div>
                          <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-green-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Design Leads</p>
                            <p className="text-3xl font-bold text-purple-600">{studioStats.designLeads}</p>
                          </div>
                          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-purple-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Studio Information Section */}
                {!isEditingStudio && studioDetailData && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Studio Information
                          </CardTitle>
                          <CardDescription>Basic studio details and settings</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditingStudio(true);
                            setStudioForm({
                              name: studioDetailData.name,
                              studio_industry_type: studioDetailData.studio_industry_type,
                              daily_design_generation_capacity: studioDetailData.daily_design_generation_capacity,
                              remarks: studioDetailData.remarks || "",
                            });
                          }}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Studio Name</Label>
                            <p className="font-semibold mt-1">{studioDetailData.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">WeDesignz Auto Name</Label>
                            <p className="font-mono text-sm mt-1 bg-muted p-2 rounded">{studioDetailData.wedesignz_auto_name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Industry Type</Label>
                            <p className="font-semibold mt-1">
                              {studioDetailData.studio_industry_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Status</Label>
                            <div className="mt-1">
                              <Badge variant={studioDetailData.status === 'active' ? 'default' : 'secondary'}>
                                {studioDetailData.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Daily Design Generation Capacity</Label>
                            <p className="font-semibold mt-1">{studioDetailData.daily_design_generation_capacity} designs</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Studio Owner</Label>
                            <p className="font-semibold mt-1">
                              {studioDetailData.created_by?.first_name && studioDetailData.created_by?.last_name
                                ? `${studioDetailData.created_by.first_name} ${studioDetailData.created_by.last_name}`
                                : studioDetailData.created_by?.username || studioDetailData.created_by?.email || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Created</Label>
                            <p className="font-semibold mt-1">
                              {format(new Date(studioDetailData.created_at || selectedStudio?.created_at || ''), 'PPP')}
                            </p>
                          </div>
                          {studioDetailData.remarks && (
                            <div>
                              <Label className="text-sm text-muted-foreground">Remarks</Label>
                              <p className="text-sm mt-1">{studioDetailData.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Edit Studio Form */}
                {isEditingStudio && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        <CardTitle>Edit Studio Information</CardTitle>
                      </div>
                      <CardDescription>
                        Update your studio details. Note: You can only have one studio, which was created during onboarding.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="studioName">Studio Name *</Label>
                          <Input
                            id="studioName"
                            value={studioForm.name}
                            onChange={(e) => setStudioForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter studio name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wedesignzAutoName">WeDesignz Auto Name</Label>
                          <Input
                            id="wedesignzAutoName"
                            value={studioDetailData?.wedesignz_auto_name || ''}
                            disabled
                            className="bg-muted font-mono"
                          />
                          <p className="text-xs text-muted-foreground">This field is readonly</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="industryType">Industry Type *</Label>
                          <Select
                            value={studioForm.studio_industry_type}
                            onValueChange={(value) => setStudioForm(prev => ({ ...prev, studio_industry_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="design_studio">Design Studio</SelectItem>
                              <SelectItem value="agency">Agency</SelectItem>
                              <SelectItem value="3d_studio">3D Studio</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={studioDetailData?.status || 'active'}
                            disabled
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Status cannot be changed</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capacity">Daily Design Generation Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={studioForm.daily_design_generation_capacity}
                          onChange={(e) => setStudioForm(prev => ({ ...prev, daily_design_generation_capacity: parseInt(e.target.value) || 0 }))}
                          min="0"
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={studioForm.remarks}
                          onChange={(e) => setStudioForm(prev => ({ ...prev, remarks: e.target.value }))}
                          rows={3}
                          placeholder="Optional notes about your studio..."
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleUpdateStudio}
                          disabled={updateStudioMutation.isPending}
                          className="gap-2"
                        >
                          {updateStudioMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingStudio(false);
                            setStudioForm({
                              name: "",
                              studio_industry_type: "design_studio",
                              daily_design_generation_capacity: 0,
                              remarks: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Business Details Section */}
                {!isEditingBusiness && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Business Details
                          </CardTitle>
                          <CardDescription>Legal and business information for your studio</CardDescription>
                        </div>
                        {businessDetails && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingBusiness(true)}
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingBusinessDetails ? (
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ) : !businessDetails ? (
                        <div className="text-center py-8">
                          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No business details found. Please add your business information.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingBusiness(true)}
                            className="mt-4 gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Add Business Details
                          </Button>
                        </div>
                      ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Studio Official Email
                            </Label>
                            <p className="font-semibold mt-1">{businessDetails.studio_email || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Not editable</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Studio Official Mobile Number
                            </Label>
                            <p className="font-semibold mt-1">{businessDetails.studio_mobile_number || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Not editable</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Legal Business Name</Label>
                            <p className="font-semibold mt-1">{businessDetails.legal_business_name || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Business Type</Label>
                            <p className="font-semibold mt-1 capitalize">{businessDetails.business_type || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Business Category</Label>
                            <p className="font-semibold mt-1 capitalize">{businessDetails.business_category || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Business Sub Category</Label>
                            <p className="font-semibold mt-1 capitalize">{businessDetails.business_sub_category || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Business Model</Label>
                            <p className="font-semibold mt-1">{businessDetails.business_model || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {businessDetails.registered_addresses_json && (
                            <div>
                              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Registered Address
                              </Label>
                              <div className="mt-1 p-3 bg-muted rounded-lg">
                                <p className="text-sm">
                                  {businessDetails.registered_addresses_json.street && `${businessDetails.registered_addresses_json.street}, `}
                                  {businessDetails.registered_addresses_json.city && `${businessDetails.registered_addresses_json.city}, `}
                                  {businessDetails.registered_addresses_json.state && `${businessDetails.registered_addresses_json.state} `}
                                  {businessDetails.registered_addresses_json.postal_code && `${businessDetails.registered_addresses_json.postal_code}`}
                                  {businessDetails.registered_addresses_json.country && `, ${businessDetails.registered_addresses_json.country}`}
                                </p>
                              </div>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              PAN Number
                            </Label>
                            <p className="font-semibold mt-1 font-mono">{businessDetails.pan_number || 'N/A'}</p>
                          </div>
                          {businessDetails.pan_card && (
                            <div>
                              <Label className="text-sm text-muted-foreground">PAN Card</Label>
                              <div className="mt-2">
                                {isPDF(businessDetails.pan_card) ? (
                                <a
                                    href={makeAbsoluteUrl(businessDetails.pan_card) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View PAN Card
                                </a>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const absoluteUrl = makeAbsoluteUrl(businessDetails.pan_card);
                                      if (absoluteUrl) {
                                        setPreviewUrl(absoluteUrl);
                                        setPreviewTitle('PAN Card');
                                        setPdfLoadError(false);
                                      } else {
                                        toast({
                                          title: 'Error',
                                          description: 'Unable to load PAN Card preview. URL is missing.',
                                          variant: 'destructive',
                                        });
                                      }
                                    }}
                                    className="text-sm text-primary hover:underline flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View PAN Card
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm text-muted-foreground">GST Number</Label>
                            <p className="font-semibold mt-1 font-mono">{businessDetails.gst_number || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">MSME Udyam Number</Label>
                            <p className="font-semibold mt-1">{businessDetails.msme_udyam_number || 'N/A'}</p>
                          </div>
                          {businessDetails.msme_certificate_annexure && (
                            <div>
                              <Label className="text-sm text-muted-foreground">MSME Certificate</Label>
                              <div className="mt-2">
                                {isPDF(businessDetails.msme_certificate_annexure) ? (
                                <a
                                    href={makeAbsoluteUrl(businessDetails.msme_certificate_annexure) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View MSME Certificate
                                </a>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const absoluteUrl = makeAbsoluteUrl(businessDetails.msme_certificate_annexure);
                                      if (absoluteUrl) {
                                        setPreviewUrl(absoluteUrl);
                                        setPreviewTitle('MSME Certificate');
                                        setPdfLoadError(false);
                                      } else {
                                        toast({
                                          title: 'Error',
                                          description: 'Unable to load MSME Certificate preview. URL is missing.',
                                          variant: 'destructive',
                                        });
                                      }
                                    }}
                                    className="text-sm text-primary hover:underline flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View MSME Certificate
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Edit Business Details Form */}
                {isEditingBusiness && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        <CardTitle>{businessDetails ? 'Edit Business Details' : 'Add Business Details'}</CardTitle>
                      </div>
                      <CardDescription>
                        {businessDetails ? 'Update your business information and legal details' : 'Add your business information and legal details'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="studioEmail">Studio Official Email</Label>
                          <Input
                            id="studioEmail"
                            value={businessDetails?.studio_email || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">Not editable</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="studioMobile">Studio Official Mobile Number</Label>
                          <Input
                            id="studioMobile"
                            value={businessDetails?.studio_mobile_number || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">Not editable</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="legalBusinessName">Legal Business Name *</Label>
                        <Input
                          id="legalBusinessName"
                          value={businessForm.legal_business_name}
                          onChange={(e) => setBusinessForm(prev => ({ ...prev, legal_business_name: e.target.value }))}
                          placeholder="Enter legal business name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="businessType">Business Type *</Label>
                          <Select
                            value={businessForm.business_type}
                            onValueChange={(value) => setBusinessForm(prev => ({ ...prev, business_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="company">Company</SelectItem>
                              <SelectItem value="llp">LLP</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessCategory">Business Category *</Label>
                          <Select
                            value={businessForm.business_category}
                            onValueChange={(value) => setBusinessForm(prev => ({ ...prev, business_category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ecommerce">Ecommerce</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessSubCategory">Business Sub Category *</Label>
                          <Select
                            value={businessForm.business_sub_category}
                            onValueChange={(value) => setBusinessForm(prev => ({ ...prev, business_sub_category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessModel">Business Model *</Label>
                        <Input
                          id="businessModel"
                          value={businessForm.business_model}
                          onChange={(e) => setBusinessForm(prev => ({ ...prev, business_model: e.target.value }))}
                          placeholder="Describe your business model"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Registered Address</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="street">Street</Label>
                            <Input
                              id="street"
                              value={businessForm.registered_addresses_json.street}
                              onChange={(e) => setBusinessForm(prev => ({
                                ...prev,
                                registered_addresses_json: { ...prev.registered_addresses_json, street: e.target.value }
                              }))}
                              placeholder="Street address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={businessForm.registered_addresses_json.city}
                              onChange={(e) => setBusinessForm(prev => ({
                                ...prev,
                                registered_addresses_json: { ...prev.registered_addresses_json, city: e.target.value }
                              }))}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={businessForm.registered_addresses_json.state}
                              onChange={(e) => setBusinessForm(prev => ({
                                ...prev,
                                registered_addresses_json: { ...prev.registered_addresses_json, state: e.target.value }
                              }))}
                              placeholder="State"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={businessForm.registered_addresses_json.postal_code}
                              onChange={(e) => setBusinessForm(prev => ({
                                ...prev,
                                registered_addresses_json: { ...prev.registered_addresses_json, postal_code: e.target.value }
                              }))}
                              placeholder="Postal code"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={businessForm.registered_addresses_json.country}
                              onChange={(e) => setBusinessForm(prev => ({
                                ...prev,
                                registered_addresses_json: { ...prev.registered_addresses_json, country: e.target.value }
                              }))}
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* PAN, GST, MSME Number in same row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="panNumber">PAN Number *</Label>
                          <Input
                            id="panNumber"
                            value={businessForm.pan_number}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gstNumber">GST Number</Label>
                          <Input
                            id="gstNumber"
                            value={businessForm.gst_number}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                            placeholder="27ABCDE1234F1Z5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="msmeNumber">MSME Udyam Number</Label>
                          <Input
                            id="msmeNumber"
                            value={businessForm.msme_udyam_number}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, msme_udyam_number: e.target.value }))}
                            placeholder="UDYAM-XX-XX-XXXXXX"
                          />
                        </div>
                      </div>

                      {/* File upload fields in same row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="panCard">PAN Card (Image/PDF)</Label>
                          {businessForm.pan_card_preview && (
                            <div className="mb-2">
                              {isPDF(businessForm.pan_card_preview) ? (
                              <a
                                href={businessForm.pan_card_preview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-2 mb-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Current PAN Card
                              </a>
                              ) : (
                                <button
                                  onClick={() => {
                                    const absoluteUrl = makeAbsoluteUrl(businessForm.pan_card_preview);
                                    if (absoluteUrl) {
                                      setPreviewUrl(absoluteUrl);
                                      setPreviewTitle('PAN Card');
                                    }
                                  }}
                                  className="text-sm text-primary hover:underline flex items-center gap-2 mb-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Current PAN Card
                                </button>
                              )}
                            </div>
                          )}
                          <Input
                            id="panCard"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBusinessForm(prev => ({ ...prev, pan_card_file: file }));
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setBusinessForm(prev => ({ ...prev, pan_card_preview: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Upload new PAN card to replace existing one</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="msmeCertificate">MSME Certificate Annexure (Image/PDF)</Label>
                          {businessForm.msme_certificate_preview && (
                            <div className="mb-2">
                              {isPDF(businessForm.msme_certificate_preview) ? (
                              <a
                                href={businessForm.msme_certificate_preview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-2 mb-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Current MSME Certificate
                              </a>
                              ) : (
                                <button
                                  onClick={() => {
                                    const absoluteUrl = makeAbsoluteUrl(businessForm.msme_certificate_preview);
                                    if (absoluteUrl) {
                                      setPreviewUrl(absoluteUrl);
                                      setPreviewTitle('MSME Certificate');
                                    }
                                  }}
                                  className="text-sm text-primary hover:underline flex items-center gap-2 mb-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Current MSME Certificate
                                </button>
                              )}
                            </div>
                          )}
                          <Input
                            id="msmeCertificate"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBusinessForm(prev => ({ ...prev, msme_certificate_file: file }));
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setBusinessForm(prev => ({ ...prev, msme_certificate_preview: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Upload new MSME certificate to replace existing one</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleUpdateBusinessDetails}
                          disabled={updateBusinessDetailsMutation.isPending}
                          className="gap-2"
                        >
                          {updateBusinessDetailsMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingBusiness(false);
                            // Reset form to original values
                            if (businessDetails) {
                              setBusinessForm({
                                legal_business_name: businessDetails.legal_business_name || "",
                                business_type: businessDetails.business_type || "individual",
                                business_category: businessDetails.business_category || "ecommerce",
                                business_sub_category: businessDetails.business_sub_category || "residential",
                                business_model: businessDetails.business_model || "",
                                pan_number: businessDetails.pan_number || "",
                                gst_number: businessDetails.gst_number || "",
                                msme_udyam_number: businessDetails.msme_udyam_number || "",
                                registered_addresses_json: businessDetails.registered_addresses_json || {
                                  street: "",
                                  city: "",
                                  state: "",
                                  postal_code: "",
                                  country: "India"
                                },
                                pan_card_file: null,
                                msme_certificate_file: null,
                                pan_card_preview: businessDetails.pan_card || null,
                                msme_certificate_preview: businessDetails.msme_certificate_annexure || null,
                              });
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Studio Members Section */}
                {!isEditingStudio && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Studio Members
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Manage members who can upload designs for your studio
                          </CardDescription>
                        </div>
                        <Button onClick={() => setShowAddMemberModal(true)} className="gap-2">
                          <UserPlus className="w-4 h-4" />
                          Add Member
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMembers ? (
                        <div className="space-y-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : members.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Add members to allow them to upload designs for your studio
                          </p>
                          <Button onClick={() => setShowAddMemberModal(true)} className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add First Member
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {members.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-sm">
                                          {member.member.first_name && member.member.last_name
                                            ? `${member.member.first_name} ${member.member.last_name}`
                                            : member.member.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {member.member.email}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={member.role}
                                      onValueChange={(value: 'design_lead' | 'designer') => {
                                        updateMemberMutation.mutate({
                                          studioId: selectedStudioId!,
                                          memberId: member.id,
                                          memberData: { role: value }
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="designer">Designer</SelectItem>
                                        <SelectItem value="design_lead">Design Lead</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={member.status}
                                      onValueChange={(value: 'active' | 'inactive') => {
                                        updateMemberMutation.mutate({
                                          studioId: selectedStudioId!,
                                          memberId: member.id,
                                          memberData: { status: value }
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setMemberToRemove(member);
                                        setShowRemoveMemberDialog(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No Studio Selected</h3>
                  <p className="text-muted-foreground">
                    Your studio information will appear here once loaded.
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Create New Member Dialog */}
      <Dialog open={showAddMemberModal} onOpenChange={(open) => {
        setShowAddMemberModal(open);
        if (!open) {
          // Reset form when closing
          setNewMemberForm({
            email: "",
            password: "",
            confirm_password: "",
            first_name: "",
            last_name: "",
            role: 'designer',
          });
          setCreatedMemberPassword(null);
          setCreatedMemberId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Studio Member</DialogTitle>
            <DialogDescription>
              Create a new user account and add them as a studio member. Login credentials will be sent via email.
            </DialogDescription>
          </DialogHeader>
          {createdMemberId && createdMemberPassword ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900 dark:text-green-100">Member created successfully!</p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The member account has been created. Click the button below to send login credentials to their email.
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setCreatedMemberPassword(null);
                    setCreatedMemberId(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedStudioId || !createdMemberId || !createdMemberPassword) {
                      toast({
                        title: "Error",
                        description: "Missing required information",
                        variant: "destructive",
                      });
                      return;
                    }
                    sendCredentialsMutation.mutate({
                      studioId: selectedStudioId,
                      memberId: createdMemberId,
                      password: createdMemberPassword,
                    });
                  }}
                  disabled={sendCredentialsMutation.isPending}
                >
                  {sendCredentialsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Login Credentials
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">Email Address *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="member@example.com"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberPassword">Password *</Label>
                    <Input
                      id="memberPassword"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newMemberForm.password}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberConfirmPassword">Confirm Password *</Label>
                    <Input
                      id="memberConfirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={newMemberForm.confirm_password}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberFirstName">First Name</Label>
                    <Input
                      id="memberFirstName"
                      placeholder="Optional"
                      value={newMemberForm.first_name}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberLastName">Last Name</Label>
                    <Input
                      id="memberLastName"
                      placeholder="Optional"
                      value={newMemberForm.last_name}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Role *</Label>
                  <Select 
                    value={newMemberForm.role} 
                    onValueChange={(value: 'design_lead' | 'designer') => setNewMemberForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="design_lead">Design Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMemberForm({
                      email: "",
                      password: "",
                      confirm_password: "",
                      first_name: "",
                      last_name: "",
                      role: 'designer',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedStudioId) {
                      toast({
                        title: "Validation error",
                        description: "Please select a studio",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (!newMemberForm.email || !newMemberForm.password || !newMemberForm.confirm_password) {
                      toast({
                        title: "Validation error",
                        description: "Please fill in all required fields",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (newMemberForm.password !== newMemberForm.confirm_password) {
                      toast({
                        title: "Validation error",
                        description: "Passwords don't match",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (newMemberForm.password.length < 8) {
                      toast({
                        title: "Validation error",
                        description: "Password must be at least 8 characters",
                        variant: "destructive",
                      });
                      return;
                    }
                    createMemberMutation.mutate({
                      studioId: selectedStudioId,
                      memberData: {
                        email: newMemberForm.email,
                        password: newMemberForm.password,
                        confirm_password: newMemberForm.confirm_password,
                        first_name: newMemberForm.first_name || undefined,
                        last_name: newMemberForm.last_name || undefined,
                        role: newMemberForm.role,
                      }
                    });
                  }}
                  disabled={createMemberMutation.isPending}
                >
                  {createMemberMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Member"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Studio Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.member.username || 'this member'}</strong> from your studio? 
              They will no longer be able to upload designs for your studio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRemoveMemberDialog(false);
              setMemberToRemove(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove && selectedStudioId) {
                  removeMemberMutation.mutate({
                    studioId: selectedStudioId,
                    memberId: memberToRemove.id
                  });
                  setShowRemoveMemberDialog(false);
                  setMemberToRemove(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => {
        if (!open) {
          setPreviewUrl(null);
          setPdfLoadError(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex items-center justify-center bg-muted/30 min-h-[400px]">
            {previewUrl && (() => {
              // Check if it's a data URL
              const isDataUrl = previewUrl.startsWith('data:');
              
              // Extract file extension from URL (handle both regular URLs and data URLs)
              let fileExtension = '';
              if (isDataUrl) {
                // For data URLs, extract from the data URL itself (e.g., data:image/jpeg;base64,...)
                const mimeMatch = previewUrl.match(/data:([^;]+)/);
                if (mimeMatch) {
                  const mimeType = mimeMatch[1];
                  if (mimeType.includes('pdf')) fileExtension = 'pdf';
                  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) fileExtension = 'jpg';
                  else if (mimeType.includes('png')) fileExtension = 'png';
                  else if (mimeType.includes('gif')) fileExtension = 'gif';
                  else if (mimeType.includes('webp')) fileExtension = 'webp';
                }
              } else {
                // For regular URLs, extract from the path
                const urlPath = previewUrl.split('?')[0]; // Remove query params
                fileExtension = urlPath.split('.').pop()?.toLowerCase() || '';
              }
              
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
              const isPDF = fileExtension === 'pdf' || previewUrl.toLowerCase().includes('.pdf') || previewUrl.toLowerCase().includes('application/pdf');
              
              if (isImage) {
                return (
                  <img 
                    src={previewUrl} 
                    alt={previewTitle} 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                );
              } else if (isPDF) {
                // For PDFs, use multiple approaches with fallbacks
                return (
                  <div className="w-full space-y-4">
                    {pdfLoadError ? (
                      <div className="w-full h-[70vh] rounded-lg border border-border bg-muted/50 flex flex-col items-center justify-center space-y-4 p-8">
                        <FileText className="w-16 h-16 text-muted-foreground" />
                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">Unable to preview PDF</p>
                          <p className="text-sm text-muted-foreground">
                            The PDF cannot be displayed in the preview. Please download or open it in a new tab.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Open in new tab
                          </a>
                          <a
                            href={previewUrl}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-[70vh] rounded-lg border border-border overflow-hidden bg-white relative">
                          {/* Use iframe for PDF preview with error handling */}
                          <iframe
                            key={previewUrl} // Force re-render when URL changes
                            src={previewUrl}
                            className="w-full h-full"
                            title={previewTitle}
                            style={{ border: 'none' }}
                            onLoad={(e) => {
                              // Reset error state when iframe loads successfully
                              const iframe = e.target as HTMLIFrameElement;
                              try {
                                // Try to check if content loaded (may fail due to CORS)
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                                if (iframeDoc) {
                                  setPdfLoadError(false);
                                }
                              } catch (err) {
                                // CORS error is expected for cross-origin PDFs, don't treat as error
                                // The PDF viewer should still work
                                setPdfLoadError(false);
                              }
                            }}
                            onError={() => {
                              setPdfLoadError(true);
                            }}
                          />
                          {/* Overlay error message if PDF fails to load */}
                          {pdfLoadError && (
                            <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center space-y-4 p-8 z-10">
                              <FileText className="w-16 h-16 text-muted-foreground" />
                              <div className="text-center space-y-2">
                                <p className="text-lg font-semibold">Unable to preview PDF</p>
                                <p className="text-sm text-muted-foreground max-w-md">
                                  The PDF cannot be displayed in the preview. This might be due to browser security restrictions or the file format.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                                  URL: {previewUrl}
                                </p>
                              </div>
                              <div className="flex gap-3">
                                <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  Open in new tab
                                </a>
                                <a
                                  href={previewUrl}
                                  download
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Having trouble viewing? Try opening in a new tab
                          </p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Open in new tab
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2 justify-center"
                    >
                      <Download className="w-4 h-4" />
                      Download file
                    </a>
                  </div>
                );
              }
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
