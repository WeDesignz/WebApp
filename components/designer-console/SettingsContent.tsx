"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Mail, 
  Phone, 
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  FileText,
  CreditCard,
  Shield,
  Moon,
  Sun,
  Bell,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudioAccess } from "@/contexts/StudioAccessContext";
import { Users, Search, Trash2 } from "lucide-react";

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

interface BusinessDetails {
  id?: number;
  studio_email: string;
  studio_mobile_number: string;
  legal_business_name: string;
  business_type: string;
  business_category: string;
  business_sub_category: string;
  business_model: string;
  registered_addresses_json?: any;
  pan_number?: string;
  pan_card?: string;
  gst_number?: string;
  msme_udyam_number?: string;
  msme_certificate_annexure?: string;
  razorpay_account_verified?: boolean;
  razorpay_linked_account_id?: string;
}

type RazorpayStatus = "not_created" | "pending" | "verified" | "rejected";

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

export default function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFullAccess, isStudioMember } = useStudioAccess();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("studio");
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [showCreateStudio, setShowCreateStudio] = useState(false);
  const [isEditingStudio, setIsEditingStudio] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  
  // Studio Members state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{id: number; username: string; email: string; first_name?: string; last_name?: string}>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<'design_lead' | 'designer'>('designer');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    designApprovals: true,
    paymentAlerts: true,
    marketingEmails: false,
  });

  // Studio form state
  const [studioForm, setStudioForm] = useState({
    name: "",
    studio_industry_type: "design_studio",
    daily_design_generation_capacity: 0,
    remarks: "",
  });

  // Business details form state
  const [businessForm, setBusinessForm] = useState<BusinessDetails>({
    studio_email: "",
    studio_mobile_number: "",
    legal_business_name: "",
    business_type: "individual",
    business_category: "ecommerce",
    business_sub_category: "residential",
    business_model: "",
    registered_addresses_json: {},
    pan_number: "",
    gst_number: "",
    msme_udyam_number: "",
  });

  const [panCardFile, setPanCardFile] = useState<File | null>(null);
  const [panCardPreview, setPanCardPreview] = useState<string | null>(null);
  const [msmeFile, setMsmeFile] = useState<File | null>(null);
  const [msmePreview, setMsmePreview] = useState<string | null>(null);

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

  // Fetch business details for selected studio
  const { data: businessDetailsData, isLoading: isLoadingBusinessDetails } = useQuery({
    queryKey: ['businessDetails', selectedStudioId],
    queryFn: async () => {
      if (!selectedStudioId) return null;
      const response = await apiClient.getStudioBusinessDetails(selectedStudioId);
      if (response.error) throw new Error(response.error);
      return response.data?.business_details;
    },
    enabled: !!selectedStudioId,
    staleTime: 30 * 1000,
  });

  const businessDetails: BusinessDetails | null = businessDetailsData || null;

  // Update business form when business details are loaded
  useEffect(() => {
    if (businessDetails) {
      setBusinessForm({
        studio_email: businessDetails.studio_email || "",
        studio_mobile_number: businessDetails.studio_mobile_number || "",
        legal_business_name: businessDetails.legal_business_name || "",
        business_type: businessDetails.business_type || "individual",
        business_category: businessDetails.business_category || "ecommerce",
        business_sub_category: businessDetails.business_sub_category || "residential",
        business_model: businessDetails.business_model || "",
        registered_addresses_json: businessDetails.registered_addresses_json || {},
        pan_number: businessDetails.pan_number || "",
        gst_number: businessDetails.gst_number || "",
        msme_udyam_number: businessDetails.msme_udyam_number || "",
      });
      if (businessDetails.pan_card) {
        setPanCardPreview(businessDetails.pan_card);
      }
      if (businessDetails.msme_certificate_annexure) {
        setMsmePreview(businessDetails.msme_certificate_annexure);
      }
    }
  }, [businessDetails]);

  // Create studio mutation
  const createStudioMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.createStudio(data);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      const responseData = data as { auto_generated_name?: string; sample_design_numbers?: { general_number?: string }; studio?: { id?: number }; [key: string]: any };
      toast({
        title: "Studio created successfully!",
        description: `Auto-generated name: ${responseData.auto_generated_name || 'N/A'}. Sample design numbers: ${responseData.sample_design_numbers?.general_number || 'N/A'}`,
      });
      setShowCreateStudio(false);
      setStudioForm({
        name: "",
        studio_industry_type: "design_studio",
        daily_design_generation_capacity: 0,
        remarks: "",
      });
      queryClient.invalidateQueries({ queryKey: ['myStudios'] });
      if (responseData.studio?.id) {
        setSelectedStudioId(responseData.studio.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create studio",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

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

  // Add studio member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ studioId, memberData }: { studioId: number; memberData: { member_id: number; role: 'design_lead' | 'designer'; status?: 'active' | 'inactive' } }) => {
      const response = await apiClient.addStudioMember(studioId, memberData);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Member added successfully",
        description: "Studio member has been added.",
      });
      setShowAddMemberModal(false);
      setSelectedMemberId(null);
      setMemberSearchQuery("");
      setSearchResults([]);
      refetchMembers();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add member",
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

  // Search users handler
  const handleSearchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearchingUsers(true);
    try {
      const response = await apiClient.searchUsers(query);
      if (response.error) {
        throw new Error(response.error);
      }
      setSearchResults(response.data?.users || []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search users.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Update business details mutation
  const updateBusinessDetailsMutation = useMutation({
    mutationFn: async ({ studioId, data }: { studioId: number; data: FormData | any }) => {
      const response = await apiClient.updateStudioBusinessDetails(studioId, data);
      if ('error' in response && response.error) throw new Error(response.error);
      return 'data' in response ? response.data : response;
    },
    onSuccess: () => {
      toast({
        title: "Business details updated",
        description: "Your business details have been updated successfully.",
      });
      setIsEditingBusiness(false);
      queryClient.invalidateQueries({ queryKey: ['businessDetails', selectedStudioId] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update business details. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateStudio = () => {
    if (!studioForm.name.trim()) {
      toast({
        title: "Validation error",
        description: "Studio name is required",
        variant: "destructive",
      });
      return;
    }

    createStudioMutation.mutate(studioForm);
  };

  const handleUpdateStudio = () => {
    if (!selectedStudioId) return;
    updateStudioMutation.mutate({
      studioId: selectedStudioId,
      data: studioForm,
    });
  };

  const handleSaveBusiness = () => {
    if (!selectedStudioId) {
      toast({
        title: "No studio selected",
        description: "Please select or create a studio first.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!businessForm.studio_email.trim() || !businessForm.studio_mobile_number.trim() || 
        !businessForm.legal_business_name.trim() || !businessForm.pan_number?.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessForm.studio_email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(businessForm.studio_mobile_number)) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    // Create FormData if files are present
    const hasFiles = panCardFile || msmeFile;
    if (hasFiles) {
      const formData = new FormData();
      formData.append('studio_email', businessForm.studio_email);
      formData.append('studio_mobile_number', businessForm.studio_mobile_number);
      formData.append('legal_business_name', businessForm.legal_business_name);
      formData.append('business_type', businessForm.business_type);
      formData.append('business_category', businessForm.business_category);
      formData.append('business_sub_category', businessForm.business_sub_category);
      formData.append('business_model', businessForm.business_model);
      formData.append('registered_addresses_json', JSON.stringify(businessForm.registered_addresses_json));
      formData.append('pan_number', businessForm.pan_number);
      if (businessForm.gst_number) formData.append('gst_number', businessForm.gst_number);
      if (businessForm.msme_udyam_number) formData.append('msme_udyam_number', businessForm.msme_udyam_number);
      
      if (panCardFile) {
        formData.append('pan_card', panCardFile);
      }
      if (msmeFile) {
        formData.append('msme_certificate_annexure', msmeFile);
      }

      updateBusinessDetailsMutation.mutate({
        studioId: selectedStudioId,
        data: formData,
      });
    } else {
      updateBusinessDetailsMutation.mutate({
        studioId: selectedStudioId,
        data: businessForm,
      });
    }
  };

  const handlePanCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPanCardFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPanCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMsmeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setMsmeFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMsmePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetryRazorpay = () => {
    toast({
      title: "Re-verification requested",
      description: "Your re-verification request has been submitted. Our team will review within 24-48 hours.",
    });
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Notification preference updated",
    });
  };

  // Get Razorpay status from business details
  const getRazorpayStatus = (): RazorpayStatus => {
    if (!businessDetails) return "not_created";
    if (businessDetails.razorpay_account_verified) return "verified";
    // If business details exist but not verified, assume pending
    return "pending";
  };

  const razorpayStatus = getRazorpayStatus();
  const razorpayRejectionReason = ""; // TODO: Get from business details if available

  const renderRazorpayStatusUI = () => {
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
                  You haven't created a Razorpay linked account yet. Complete the business details to enable payouts.
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
                
                {razorpayRejectionReason && (
                  <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-destructive mb-1">Rejection Reason</h4>
                        <p className="text-sm text-muted-foreground">
                          {razorpayRejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings, preferences, and linked accounts
          </p>
        </div>

        {/* Theme Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your console</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mounted ? (
                  theme === "dark" ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : (
                    <Sun className="w-5 h-5 text-primary" />
                  )
                ) : (
                  <div className="w-5 h-5" />
                )}
                <div>
                  <Label className="text-base font-semibold">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    {mounted ? (theme === "dark" ? "Dark mode" : "Light mode") : "Loading..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {mounted && (
                  <>
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={() => handleNotificationChange("emailNotifications")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                checked={notifications.pushNotifications}
                onCheckedChange={() => handleNotificationChange("pushNotifications")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Design Approvals</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your designs are approved or rejected
                </p>
              </div>
              <Switch
                checked={notifications.designApprovals}
                onCheckedChange={() => handleNotificationChange("designApprovals")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Payment Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about payments and settlements
                </p>
              </div>
              <Switch
                checked={notifications.paymentAlerts}
                onCheckedChange={() => handleNotificationChange("paymentAlerts")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
              <Switch
                checked={notifications.marketingEmails}
                onCheckedChange={() => handleNotificationChange("marketingEmails")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Studio and Business Details - Only show for studio owners */}
        {hasFullAccess ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="studio">Studio Management</TabsTrigger>
              <TabsTrigger value="members">Studio Members</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
            </TabsList>

          {/* Studio Management Tab */}
          <TabsContent value="studio" className="mt-6 space-y-6">
            {isLoadingStudios ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ) : studios.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No studio found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first studio to get started
                  </p>
                  <Button onClick={() => setShowCreateStudio(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Studio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Studio List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>My Studios</CardTitle>
                        <CardDescription>Manage your design studios</CardDescription>
                      </div>
                      {!showCreateStudio && (
                        <Button onClick={() => setShowCreateStudio(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Studio
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studios.map((studio) => (
                        <Card
                          key={studio.id}
                          className={`cursor-pointer transition-colors ${
                            selectedStudioId === studio.id ? 'border-primary' : ''
                          }`}
                          onClick={() => setSelectedStudioId(studio.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{studio.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Auto Name: {studio.wedesignz_auto_name}
                                </p>
                                <Badge variant="outline" className="mt-2">
                                  {studio.studio_industry_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudioId(studio.id);
                                  setIsEditingStudio(true);
                                  setStudioForm({
                                    name: studio.name,
                                    studio_industry_type: studio.studio_industry_type,
                                    daily_design_generation_capacity: studio.daily_design_generation_capacity,
                                    remarks: studio.remarks || "",
                                  });
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Create/Edit Studio Form */}
                {(showCreateStudio || isEditingStudio) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {showCreateStudio ? "Create New Studio" : "Edit Studio"}
                      </CardTitle>
                      <CardDescription>
                        {showCreateStudio 
                          ? "Create a new studio. An auto-generated unique name will be assigned."
                          : "Update your studio information"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <Label htmlFor="capacity">Daily Design Generation Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={studioForm.daily_design_generation_capacity}
                          onChange={(e) => setStudioForm(prev => ({ ...prev, daily_design_generation_capacity: parseInt(e.target.value) || 0 }))}
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={studioForm.remarks}
                          onChange={(e) => setStudioForm(prev => ({ ...prev, remarks: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={showCreateStudio ? handleCreateStudio : handleUpdateStudio}
                          disabled={createStudioMutation.isPending || updateStudioMutation.isPending}
                        >
                          {createStudioMutation.isPending || updateStudioMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {showCreateStudio ? "Creating..." : "Updating..."}
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {showCreateStudio ? "Create Studio" : "Save Changes"}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateStudio(false);
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

                {/* Studio Details */}
                {selectedStudioId && studioDetailData && !showCreateStudio && !isEditingStudio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Studio Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingStudioDetail ? (
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Studio Name</Label>
                            <p className="font-semibold">{studioDetailData.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Auto-Generated Name</Label>
                            <p className="font-semibold font-mono">{studioDetailData.wedesignz_auto_name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Industry Type</Label>
                            <p className="font-semibold">{studioDetailData.studio_industry_type.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Daily Capacity</Label>
                            <p className="font-semibold">{studioDetailData.daily_design_generation_capacity}</p>
                          </div>
                          {studioDetailData.remarks && (
                            <div>
                              <Label className="text-sm text-muted-foreground">Remarks</Label>
                              <p className="font-semibold">{studioDetailData.remarks}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Business Details Tab */}
          <TabsContent value="business" className="mt-6 space-y-6">
            {!selectedStudioId ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">No studio selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Please create or select a studio first to manage business details
                  </p>
                  <Button onClick={() => setActiveTab("studio")}>
                    Go to Studio Management
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Linked Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Linked Account Status
                    </CardTitle>
                    <CardDescription>Manage your Razorpay linked account for payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderRazorpayStatusUI()}
                  </CardContent>
                </Card>

                {/* Business Details Form */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Business Information</CardTitle>
                        <CardDescription>Update your business details for Razorpay verification</CardDescription>
                      </div>
                      {!isEditingBusiness && businessDetails && (
                        <Button onClick={() => setIsEditingBusiness(true)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBusinessDetails ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
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
                              value={businessForm.studio_email}
                              onChange={(e) => setBusinessForm(prev => ({ ...prev, studio_email: e.target.value }))}
                              className="pl-10"
                              placeholder="business@example.com"
                              disabled={!isEditingBusiness}
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
                              value={businessForm.studio_mobile_number}
                              onChange={(e) => setBusinessForm(prev => ({ ...prev, studio_mobile_number: e.target.value }))}
                              className="pl-10"
                              placeholder="9123456789"
                              maxLength={10}
                              disabled={!isEditingBusiness}
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
                              value={businessForm.legal_business_name}
                              onChange={(e) => setBusinessForm(prev => ({ ...prev, legal_business_name: e.target.value }))}
                              className="pl-10"
                              placeholder="Your Business Name"
                              disabled={!isEditingBusiness}
                            />
                          </div>
                        </div>

                        {/* Business Type */}
                        <div>
                          <Label htmlFor="businessType" className="text-sm font-medium mb-2 block">
                            Business Type <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={businessForm.business_type}
                            onValueChange={(value) => setBusinessForm(prev => ({ ...prev, business_type: value }))}
                            disabled={!isEditingBusiness}
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

                        {/* Business Category */}
                        <div>
                          <Label htmlFor="businessCategory" className="text-sm font-medium mb-2 block">
                            Business Category <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={businessForm.business_category}
                            onValueChange={(value) => setBusinessForm(prev => ({ ...prev, business_category: value }))}
                            disabled={!isEditingBusiness}
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

                        {/* Business Sub Category */}
                        <div>
                          <Label htmlFor="businessSubCategory" className="text-sm font-medium mb-2 block">
                            Business Sub Category <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={businessForm.business_sub_category}
                            onValueChange={(value) => setBusinessForm(prev => ({ ...prev, business_sub_category: value }))}
                            disabled={!isEditingBusiness}
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

                        {/* Business Model */}
                        <div>
                          <Label htmlFor="businessModel" className="text-sm font-medium mb-2 block">
                            Business Model <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="businessModel"
                            value={businessForm.business_model}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, business_model: e.target.value }))}
                            placeholder="Describe your business model"
                            disabled={!isEditingBusiness}
                          />
                        </div>

                        <Separator className="my-4" />

                        {/* PAN Number */}
                        <div>
                          <Label htmlFor="panNumber" className="text-sm font-medium mb-2 block">
                            PAN Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="panNumber"
                            value={businessForm.pan_number}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            disabled={!isEditingBusiness}
                          />
                        </div>

                        {/* PAN Card Upload */}
                        {isEditingBusiness && (
                          <div>
                            <Label htmlFor="panCard" className="text-sm font-medium mb-2 block">
                              PAN Card (Image/PDF) <span className="text-destructive">*</span>
                            </Label>
                            <div className="space-y-2">
                              {panCardPreview && (
                                <div className="relative inline-block">
                                  {panCardPreview.startsWith('data:') || panCardPreview.startsWith('http') ? (
                                    <img
                                      src={panCardPreview}
                                      alt="PAN Card"
                                      className="h-32 w-auto border border-border rounded-lg"
                                    />
                                  ) : (
                                    <div className="h-32 w-48 border border-border rounded-lg flex items-center justify-center bg-muted">
                                      <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  {isEditingBusiness && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2"
                                      onClick={() => {
                                        setPanCardFile(null);
                                        setPanCardPreview(null);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <Input
                                id="panCard"
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handlePanCardUpload}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground">
                                Upload PAN card image or PDF (max 5MB)
                              </p>
                            </div>
                          </div>
                        )}

                        {/* GST Number */}
                        <div>
                          <Label htmlFor="gstNumber" className="text-sm font-medium mb-2 block">
                            GST Number (Optional)
                          </Label>
                          <Input
                            id="gstNumber"
                            value={businessForm.gst_number}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                            placeholder="27ABCDE1234F1Z5"
                            disabled={!isEditingBusiness}
                          />
                        </div>

                        {/* MSME Udyam Number */}
                        <div>
                          <Label htmlFor="msmeNumber" className="text-sm font-medium mb-2 block">
                            MSME Udyam Number (Optional)
                          </Label>
                          <Input
                            id="msmeNumber"
                            value={businessForm.msme_udyam_number}
                            onChange={(e) => setBusinessForm(prev => ({ ...prev, msme_udyam_number: e.target.value }))}
                            placeholder="UDYAM-XX-XX-XXXXXX"
                            disabled={!isEditingBusiness}
                          />
                        </div>

                        {/* MSME Certificate Upload */}
                        {isEditingBusiness && (
                          <div>
                            <Label htmlFor="msmeCertificate" className="text-sm font-medium mb-2 block">
                              MSME Certificate Annexure (Image/PDF) (Optional)
                            </Label>
                            <div className="space-y-2">
                              {msmePreview && (
                                <div className="relative inline-block">
                                  {msmePreview.startsWith('data:') || msmePreview.startsWith('http') ? (
                                    <img
                                      src={msmePreview}
                                      alt="MSME Certificate"
                                      className="h-32 w-auto border border-border rounded-lg"
                                    />
                                  ) : (
                                    <div className="h-32 w-48 border border-border rounded-lg flex items-center justify-center bg-muted">
                                      <FileText className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  {isEditingBusiness && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2"
                                      onClick={() => {
                                        setMsmeFile(null);
                                        setMsmePreview(null);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <Input
                                id="msmeCertificate"
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleMsmeUpload}
                                className="cursor-pointer"
                              />
                              <p className="text-xs text-muted-foreground">
                                Upload MSME certificate image or PDF (max 5MB)
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {isEditingBusiness && (
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleSaveBusiness}
                              disabled={updateBusinessDetailsMutation.isPending}
                            >
                              {updateBusinessDetailsMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save Business Details
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
                                    studio_email: businessDetails.studio_email || "",
                                    studio_mobile_number: businessDetails.studio_mobile_number || "",
                                    legal_business_name: businessDetails.legal_business_name || "",
                                    business_type: businessDetails.business_type || "individual",
                                    business_category: businessDetails.business_category || "ecommerce",
                                    business_sub_category: businessDetails.business_sub_category || "residential",
                                    business_model: businessDetails.business_model || "",
                                    registered_addresses_json: businessDetails.registered_addresses_json || {},
                                    pan_number: businessDetails.pan_number || "",
                                    gst_number: businessDetails.gst_number || "",
                                    msme_udyam_number: businessDetails.msme_udyam_number || "",
                                  });
                                  if (businessDetails.pan_card) {
                                    setPanCardPreview(businessDetails.pan_card);
                                  }
                                  if (businessDetails.msme_certificate_annexure) {
                                    setMsmePreview(businessDetails.msme_certificate_annexure);
                                  }
                                }
                                setPanCardFile(null);
                                setMsmeFile(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Studio Members Tab */}
          <TabsContent value="members" className="mt-6 space-y-6">
            {!selectedStudioId ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">Select a Studio</h3>
                  <p className="text-muted-foreground">
                    Please select a studio to manage its members
                  </p>
                </CardContent>
              </Card>
            ) : isLoadingMembers ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Studio Members</CardTitle>
                        <CardDescription>
                          Manage members who can upload designs for your studio
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowAddMemberModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add members to allow them to upload designs for your studio
                        </p>
                        <Button onClick={() => setShowAddMemberModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Member
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {members.map((member) => (
                          <Card key={member.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold">
                                        {member.member.first_name && member.member.last_name
                                          ? `${member.member.first_name} ${member.member.last_name}`
                                          : member.member.username}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {member.member.email}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-3 ml-13">
                                    <Badge variant="outline">
                                      {member.role === 'design_lead' ? 'Design Lead' : 'Designer'}
                                    </Badge>
                                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                      {member.status === 'active' ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Added {new Date(member.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
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
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to remove ${member.member.username} from the studio?`)) {
                                        removeMemberMutation.mutate({
                                          studioId: selectedStudioId!,
                                          memberId: member.id
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">Settings Restricted</h3>
              <p className="text-muted-foreground">
                Studio members cannot change settings. Only studio owners can manage studio settings.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Member Modal */}
        <AlertDialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Add Studio Member</AlertDialogTitle>
              <AlertDialogDescription>
                Search for a user to add as a studio member. They will be able to upload designs for your studio.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Search User</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or username..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      handleSearchUsers(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
                {isSearchingUsers && (
                  <p className="text-xs text-muted-foreground mt-1">Searching...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 cursor-pointer hover:bg-accent border-b last:border-0 ${
                          selectedMemberId === user.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => setSelectedMemberId(user.id)}
                      >
                        <p className="font-medium text-sm">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedMemberId && (
                <div>
                  <Label>Role</Label>
                  <Select value={newMemberRole} onValueChange={(value: 'design_lead' | 'designer') => setNewMemberRole(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="designer">Designer</SelectItem>
                      <SelectItem value="design_lead">Design Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedMemberId(null);
                  setMemberSearchQuery("");
                  setSearchResults([]);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!selectedStudioId || !selectedMemberId) {
                    toast({
                      title: "Validation error",
                      description: "Please select a user to add",
                      variant: "destructive",
                    });
                    return;
                  }
                  addMemberMutation.mutate({
                    studioId: selectedStudioId,
                    memberData: {
                      member_id: selectedMemberId,
                      role: newMemberRole,
                      status: 'active'
                    }
                  });
                }}
                disabled={!selectedMemberId || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Member"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
