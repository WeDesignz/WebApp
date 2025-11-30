"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Calendar,
  TrendingUp,
  Star,
  Zap,
  Crown,
  Loader2,
  AlertCircle,
  Download,
  FileText,
  Clock,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { initializeRazorpayCheckout } from "@/lib/payment";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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

interface Plan {
  id: number;
  plan_name: string;
  plan_name_display?: string;
  description: any; // JSONField
  price: number;
  plan_duration: string;
  status: string;
  subscriptions_count?: number;
  discount?: number;
  custom_design_hour?: number;
  mock_pdf_count?: number;
  no_of_free_downloads?: number;
}

interface Subscription {
  id: number;
  plan: Plan;
  status: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  free_downloads_used?: number;
  mock_pdf_downloads_used?: number;
  remaining_free_downloads?: number;
  remaining_mock_pdf_downloads?: number;
  // Monthly period fields for annual plans
  current_period_downloads_used?: number | null;
  current_period_downloads_allowed?: number | null;
  current_period_remaining?: number | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_period_reset_date?: string | null;
}

// Icon mapping for plan names
const iconMap: Record<string, any> = {
  basic: Star,
  prime: Zap,
  premium: Crown,
};

// Color mapping for plan names
const colorMap: Record<string, string> = {
  basic: "from-blue-500 to-cyan-500",
  prime: "from-purple-500 to-pink-500",
  premium: "from-orange-500 to-red-500",
};

export default function PlansContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch plans
  const { data: plansData, isLoading: isLoadingPlans, error: plansError } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.getPlans();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch current subscription
  const { data: subscriptionData, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      const response = await apiClient.getMySubscription();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch subscription usage
  const { data: usageData } = useQuery({
    queryKey: ['subscriptionUsage'],
    queryFn: async () => {
      const response = await apiClient.getSubscriptionUsage();
      if (response.error) {
        return null;
      }
      return response.data?.usage;
    },
    enabled: !!subscriptionData?.has_active_subscription,
    staleTime: 30 * 1000,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, autoRenew }: { planId: number; autoRenew: boolean }) => {
      return apiClient.subscribeToPlan(planId, autoRenew);
    },
    onSuccess: async (response) => {
      if (response.error) {
        throw new Error(response.error);
      }
      await refetchSubscription();
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Subscription successful!",
        description: "You have successfully subscribed to the plan.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return apiClient.cancelSubscription();
    },
    onSuccess: async (response) => {
      if (response.error) {
        throw new Error(response.error);
      }
      await refetchSubscription();
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      setCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const hasSubscription = subscriptionData?.has_active_subscription || false;
  const currentSubscription = subscriptionData?.subscription as Subscription | undefined;
  const currentPlan = subscriptionData?.plan as Plan | undefined;

  // Filter plans by billing cycle
  const currentPlans = billingCycle === "monthly"
    ? (plansData?.monthly_plans || [])
    : (plansData?.annual_plans || []);

  // Handle plan selection and payment
  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (hasSubscription) {
      toast({
        title: "Already subscribed",
        description: "You already have an active subscription. Please cancel it first.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlan(plan.id);
    setIsProcessingPayment(true);

    try {
      // Step 1: Create subscription (this now also creates Order)
      const subscribeResponse = await apiClient.subscribeToPlan(plan.id, true);

      if (subscribeResponse.error) {
        // If subscription creation fails due to existing subscription, handle it
        if (subscribeResponse.error.includes('already has an active subscription')) {
          toast({
            title: "Already subscribed",
            description: "You already have an active subscription.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(subscribeResponse.error);
      }

      // Get order_id from subscription creation response
      const orderId = subscribeResponse.data?.order_id;
      if (!orderId) {
        throw new Error('Failed to create order for subscription');
      }

      // Step 2: Create payment order with order_id to link payment to order
      const paymentOrderResponse = await apiClient.createPaymentOrder({
        amount: parseFloat(plan.price.toString()),
        currency: 'INR',
        description: `Subscription: ${plan.plan_name_display || plan.plan_name} - ${plan.plan_duration}`,
        order_id: orderId.toString(), // Link payment to order
      });

      if (paymentOrderResponse.error || !paymentOrderResponse.data) {
        throw new Error(paymentOrderResponse.error || 'Failed to create payment order');
      }

      const { razorpay_order_id, payment_id } = paymentOrderResponse.data;

      // Step 3: Initialize Razorpay checkout
      const paymentResult = await initializeRazorpayCheckout({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: parseFloat(plan.price.toString()) * 100, // Convert rupees to paise for Razorpay
        currency: 'INR',
        name: 'WeDesign',
        description: `Subscription: ${plan.plan_name_display || plan.plan_name} - ${plan.plan_duration}`,
        order_id: razorpay_order_id,
        theme: {
          color: '#8B5CF6',
        },
      });

      if (!paymentResult.success || !paymentResult.razorpay_payment_id) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Step 4: Capture payment
      const captureResponse = await apiClient.capturePayment({
        payment_id: payment_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id!,
        amount: parseFloat(plan.price.toString()),
      });

      if (captureResponse.error) {
        throw new Error(captureResponse.error || 'Failed to capture payment');
      }

      // Step 5: Success
      await refetchSubscription();
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Subscription successful!",
        description: "Your subscription is now active.",
      });
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message || "Failed to complete subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  // Format plan name for display
  const getPlanDisplayName = (planName: string) => {
    const nameMap: Record<string, string> = {
      basic: "Starter",
      prime: "Pro",
      premium: "Enterprise",
    };
    return nameMap[planName] || planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  // Parse description (JSONField) to get features array
  const getPlanFeatures = (description: any): string[] => {
    if (Array.isArray(description)) {
      return description;
    }
    if (typeof description === 'object' && description !== null) {
      if (description.features && Array.isArray(description.features)) {
        return description.features;
      }
    }
    if (typeof description === 'string') {
      try {
        const parsed = JSON.parse(description);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.features && Array.isArray(parsed.features)) return parsed.features;
      } catch {
        return [description];
      }
    }
    return [];
  };

  // Calculate next billing date (30 days from subscription start for monthly, 365 for annual)
  const getNextBillingDate = (subscription: Subscription): string => {
    if (!subscription) return '';
    const startDate = new Date(subscription.created_at);
    const duration = subscription.plan.plan_duration === 'monthly' ? 30 : 365;
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + duration);
    return nextDate.toISOString();
  };

  if (isLoadingPlans) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Failed to load plans</h3>
                <p className="text-sm text-muted-foreground">
                  {plansError instanceof Error ? plansError.message : 'An error occurred'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Plans & Subscriptions
          </h1>
          <p className="text-muted-foreground">
            Choose the perfect plan for your design needs
          </p>
        </div>

        {hasSubscription && currentSubscription && currentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/5 border-primary/30 shadow-lg overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-6 border-b border-primary/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl shadow-md">
                      <CreditCard className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Current Subscription
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge 
                          variant="default" 
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1"
                        >
                          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                          {currentSubscription.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">
                          {getPlanDisplayName(currentPlan.plan_name)} Plan
                        </span>
                        <Badge variant="outline" className="border-primary/30">
                          {currentPlan.plan_duration === 'annually' ? 'Annual' : 'Monthly'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscriptionMutation.isPending}
                    className="border-red-500/30 text-red-600 hover:bg-red-50 hover:border-red-500 dark:hover:bg-red-950/20"
                  >
                    {cancelSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-6">

              {/* Plan Features & Benefits */}
              <div className="space-y-4 mb-6">
                {/* Free Downloads - Full Width */}
                {currentPlan.no_of_free_downloads !== undefined && currentPlan.no_of_free_downloads > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                        <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">Free Downloads</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Monthly Tracking (for annual plans only) */}
                      {currentPlan.plan_duration === 'annually' && 
                       currentSubscription.current_period_downloads_allowed !== null && 
                       currentSubscription.current_period_downloads_allowed !== undefined && (
                        <div className="flex flex-col">
                          <div className="flex justify-between items-baseline mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Month</span>
                            </div>
                            <span className={`text-2xl font-bold leading-tight ${
                              (currentSubscription.current_period_remaining ?? 0) === 0 
                                ? 'text-destructive' 
                                : (currentSubscription.current_period_remaining ?? 0) <= 2 
                                  ? 'text-orange-500' 
                                  : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              {currentSubscription.current_period_downloads_used ?? 0}
                              <span className="text-base text-muted-foreground font-normal">/{currentSubscription.current_period_downloads_allowed}</span>
                            </span>
                          </div>
                          <Progress
                            value={((currentSubscription.current_period_downloads_used ?? 0) / (currentSubscription.current_period_downloads_allowed ?? 1)) * 100}
                            className={`h-2.5 ${
                              ((currentSubscription.current_period_downloads_used ?? 0) / (currentSubscription.current_period_downloads_allowed ?? 1)) >= 1
                                ? '[&>div]:bg-destructive'
                                : ((currentSubscription.current_period_downloads_used ?? 0) / (currentSubscription.current_period_downloads_allowed ?? 1)) >= 0.8
                                  ? '[&>div]:bg-orange-500'
                                  : '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500'
                            }`}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <p className={`text-xs font-medium ${
                              (currentSubscription.current_period_remaining ?? 0) === 0 
                                ? 'text-destructive' 
                                : (currentSubscription.current_period_remaining ?? 0) <= 2 
                                  ? 'text-orange-500' 
                                  : 'text-muted-foreground'
                            }`}>
                              <span className="font-bold">{currentSubscription.current_period_remaining ?? 0}</span> remaining this month
                            </p>
                            {currentSubscription.next_period_reset_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>Resets {new Date(currentSubscription.next_period_reset_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                })}</span>
                              </div>
                            )}
                          </div>
                          {(currentSubscription.current_period_remaining ?? 0) === 0 && (
                            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md mt-2">
                              <p className="text-xs text-destructive font-semibold flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Limit reached. Resets {currentSubscription.next_period_reset_date 
                                  ? new Date(currentSubscription.next_period_reset_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric"
                                    })
                                  : 'soon'}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total Downloads (for all plans) */}
                      <div className="flex flex-col border-l border-purple-500/20 pl-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Remaining</span>
                          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 leading-tight">
                            {currentSubscription.remaining_free_downloads ?? currentPlan.no_of_free_downloads}
                            <span className="text-base text-muted-foreground font-normal">/{currentPlan.no_of_free_downloads}</span>
                          </span>
                        </div>
                        <Progress
                          value={((currentSubscription.remaining_free_downloads ?? currentPlan.no_of_free_downloads) / currentPlan.no_of_free_downloads) * 100}
                          className="h-2.5 bg-purple-500/10 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">{currentSubscription.free_downloads_used ?? 0}</span> used
                          </p>
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {Math.round(((currentSubscription.remaining_free_downloads ?? currentPlan.no_of_free_downloads) / currentPlan.no_of_free_downloads) * 100)}% remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Other Features - Compact Grid */}
                <div className="grid md:grid-cols-3 gap-3">
                  {/* Discount */}
                  {currentPlan.discount !== undefined && currentPlan.discount > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-lg p-3 border border-green-500/20 hover:border-green-500/40 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-green-500/20 rounded-lg flex-shrink-0">
                          <Percent className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Discount</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400 leading-tight">
                            {currentPlan.discount}%
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">On all purchases</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Custom Design Hours */}
                  {currentPlan.custom_design_hour !== undefined && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-lg p-3 border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Custom Design</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
                            {currentPlan.custom_design_hour}h
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Delivery time</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Mock PDF Downloads */}
                  {currentPlan.mock_pdf_count !== undefined && currentPlan.mock_pdf_count > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 rounded-lg p-3 border border-indigo-500/20 hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Mock PDFs</p>
                          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                            {currentSubscription.remaining_mock_pdf_downloads ?? currentPlan.mock_pdf_count}
                            <span className="text-sm text-muted-foreground font-normal">/{currentPlan.mock_pdf_count}</span>
                          </p>
                          <div className="mt-1.5 space-y-1">
                            <Progress
                              value={((currentSubscription.remaining_mock_pdf_downloads ?? currentPlan.mock_pdf_count) / currentPlan.mock_pdf_count) * 100}
                              className="h-1.5 bg-indigo-500/10 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-blue-500"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              <span className="font-semibold">{currentSubscription.mock_pdf_downloads_used ?? 0}</span> used
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Additional Info Grid */}
              <div className="grid md:grid-cols-3 gap-3 pt-4 border-t border-primary/20">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-lg p-3 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-amber-500/20 rounded-lg flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Next Billing</span>
                  </div>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-tight">
                    {new Date(getNextBillingDate(currentSubscription)).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-lg p-3 border border-teal-500/20 hover:border-teal-500/40 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-teal-500/20 rounded-lg flex-shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Auto Renew</span>
                  </div>
                  <Badge 
                    variant={currentSubscription.auto_renew ? "default" : "secondary"}
                    className={`text-xs px-2 py-0.5 ${
                      currentSubscription.auto_renew 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentSubscription.auto_renew ? (
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Enabled
                      </span>
                    ) : (
                      "Disabled"
                    )}
                  </Badge>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-lg p-3 border border-violet-500/20 hover:border-violet-500/40 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-violet-500/20 rounded-lg flex-shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Started</span>
                  </div>
                  <p className="text-lg font-bold text-violet-600 dark:text-violet-400 leading-tight">
                    {new Date(currentSubscription.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </motion.div>
              </div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <Switch
            checked={billingCycle === "annual"}
            onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
          />
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${billingCycle === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {billingCycle === "annual" && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        {currentPlans.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No plans available for {billingCycle} billing cycle.</p>
          </Card>
        ) : (
        <div className="grid md:grid-cols-3 gap-6">
            {currentPlans.map((plan: Plan, index: number) => {
              const Icon = iconMap[plan.plan_name] || Star;
              const color = colorMap[plan.plan_name] || "from-blue-500 to-cyan-500";
              const displayName = getPlanDisplayName(plan.plan_name);
              const features = getPlanFeatures(plan.description);
              const isCurrentPlan = hasSubscription && currentPlan?.id === plan.id;
              const isPopular = plan.plan_name === 'prime' || plan.plan_name === 'premium';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden h-full flex flex-col ${
                      isPopular
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-border"
                  }`}
                >
                    {isPopular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-primary">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold">{displayName}</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-4xl font-bold">₹{parseFloat(plan.price.toString()).toFixed(2)}</span>
                        <span className="text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        </div>
                    </div>

                    <ul className="space-y-3 flex-1">
                        {features.length > 0 ? (
                          features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                          ))
                        ) : (
                          <li className="text-sm text-muted-foreground">
                            {plan.description || 'No features listed'}
                          </li>
                        )}
                    </ul>

                    <Button
                      className={`w-full ${
                          isPopular
                            ? `bg-gradient-to-r ${color} hover:opacity-90`
                          : ""
                      }`}
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan)}
                        disabled={isCurrentPlan || isProcessingPayment || subscribeMutation.isPending || !user}
                      >
                        {isProcessingPayment && selectedPlan === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : hasSubscription ? (
                          "Already Subscribed"
                        ) : (
                          "Get Started"
                        )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
        )}

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Need a custom plan?</h3>
                <p className="text-sm text-muted-foreground">
                  Get in touch with our sales team for enterprise solutions
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-primary">
              Contact Sales
            </Button>
          </div>
        </Card>
      </div>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You will lose access to all premium features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
