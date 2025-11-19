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
}

interface Subscription {
  id: number;
  plan: Plan;
  status: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
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
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Current Subscription</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        {currentSubscription.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getPlanDisplayName(currentPlan.plan_name)} Plan - {currentPlan.plan_duration}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscriptionMutation.isPending}
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

              <div className="grid md:grid-cols-3 gap-6">
                {usageData && (
                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Usage This Month</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Designs</span>
                      <span className="font-semibold">
                          {usageData.designs_used || 0} of {usageData.designs_limit || 'Unlimited'}
                      </span>
                    </div>
                      {usageData.designs_limit && (
                    <Progress
                          value={((usageData.designs_used || 0) / usageData.designs_limit) * 100}
                      className="h-2"
                    />
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Next Billing Date</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {new Date(getNextBillingDate(currentSubscription)).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Auto Renew</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentSubscription.auto_renew ? "default" : "secondary"}>
                      {currentSubscription.auto_renew ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
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
