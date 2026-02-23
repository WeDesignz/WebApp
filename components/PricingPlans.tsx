"use client";

import ElectricBorder from "@/components/ElectricBorder";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Plan {
  id: number;
  plan_name: string;
  plan_name_display?: string;
  description: any; // JSONField
  price: number;
  plan_duration: string;
  status: string;
  discount?: number;
  custom_design_hour?: number;
  mock_pdf_count?: number;
  no_of_free_downloads?: number;
  is_most_popular?: boolean;
}

// Map plan_name values to display names (matching Django choices)
const PLAN_NAME_DISPLAY_MAP: Record<string, string> = {
  'basic': 'Basic',
  'prime': 'Prime',
  'premium': 'Premium',
};

interface TransformedPlan {
  id: number;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyTag: string;
  annualTag: string;
  monthlyBullets: string[];
  annualBullets: string[];
  highlight: boolean;
  plan_name: string;
  monthlyPlanId?: number;
  annualPlanId?: number;
  monthlyIsMostPopular?: boolean;
  annualIsMostPopular?: boolean;
}

export default function PricingPlans() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<TransformedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Format plan name for display - use actual plan_name from database
  const getPlanDisplayName = (planName: string) => {
    // Use the mapping from Django choices, or capitalize if not found
    return PLAN_NAME_DISPLAY_MAP[planName] || planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  // Get tag from plan description
  const getPlanTag = (plan: Plan | undefined, planName: string): string => {
    if (!plan) {
      // Default tags based on plan name
      if (planName === 'basic') return "Perfect for getting started";
      if (planName === 'prime') return "For professional designers";
      if (planName === 'premium') return "For teams and agencies";
      return "Perfect for your needs";
    }

    if (typeof plan.description === 'object' && plan.description?.tag) {
      return plan.description.tag;
    }
    
    // Default tags based on plan name
    if (planName === 'basic') return "Perfect for getting started";
    if (planName === 'prime') return "For professional designers";
    if (planName === 'premium') return "For teams and agencies";
    return "Perfect for your needs";
  };

  // Transform API plans to component format
  const transformPlans = (monthlyPlans: Plan[], annualPlans: Plan[]): TransformedPlan[] => {
    const planMap = new Map<string, { monthly?: Plan; annual?: Plan }>();

    // Group plans by plan_name
    monthlyPlans.forEach(plan => {
      if (!planMap.has(plan.plan_name)) {
        planMap.set(plan.plan_name, {});
      }
      planMap.get(plan.plan_name)!.monthly = plan;
    });

    annualPlans.forEach(plan => {
      if (!planMap.has(plan.plan_name)) {
        planMap.set(plan.plan_name, {});
      }
      planMap.get(plan.plan_name)!.annual = plan;
    });

    // Transform to component format - only show plans that actually exist in database
    const transformed: TransformedPlan[] = [];
    
    // Get all unique plan names from the database (both monthly and annual)
    const allPlanNames = Array.from(planMap.keys());
    
    // Sort plan names in a consistent order (basic, prime, premium) if they exist
    const planOrder = ['basic', 'prime', 'premium'];
    const sortedPlanNames = allPlanNames.sort((a, b) => {
      const indexA = planOrder.indexOf(a);
      const indexB = planOrder.indexOf(b);
      // If both are in the order array, sort by their index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only one is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in the order array, maintain original order
      return 0;
    });

    sortedPlanNames.forEach(planName => {
      const plans = planMap.get(planName);
      if (!plans) return;

      const monthlyPlan = plans.monthly;
      const annualPlan = plans.annual;

      // Need at least one plan (monthly or annual) to display
      if (!monthlyPlan && !annualPlan) return;
      
      // Only show plans that have a price > 0 for at least one duration
      const hasMonthlyPrice = monthlyPlan && parseFloat(monthlyPlan.price.toString()) > 0;
      const hasAnnualPrice = annualPlan && parseFloat(annualPlan.price.toString()) > 0;
      if (!hasMonthlyPrice && !hasAnnualPrice) return;

      // Use actual plan_name from database for display
      const displayName = getPlanDisplayName(planName);

      // Get features and tags for both monthly and annual
      const monthlyFeatures = monthlyPlan ? getPlanFeatures(monthlyPlan.description) : [];
      const annualFeatures = annualPlan ? getPlanFeatures(annualPlan.description) : [];
      
      // Use the plan that exists, or prefer monthly if both exist
      const sourcePlan = monthlyPlan || annualPlan;
      const fallbackFeatures = [
        planName === 'basic' ? "Basic features" : 
        planName === 'prime' ? "Advanced features" : 
        "Premium features"
      ];

      transformed.push({
        id: sourcePlan!.id,
        name: displayName,
        monthlyPrice: monthlyPlan ? parseFloat(monthlyPlan.price.toString()) : 0,
        annualPrice: annualPlan ? parseFloat(annualPlan.price.toString()) : 0,
        monthlyTag: getPlanTag(monthlyPlan, planName),
        annualTag: getPlanTag(annualPlan, planName),
        monthlyBullets: monthlyFeatures.length > 0 ? monthlyFeatures : (annualFeatures.length > 0 ? annualFeatures : fallbackFeatures),
        annualBullets: annualFeatures.length > 0 ? annualFeatures : (monthlyFeatures.length > 0 ? monthlyFeatures : fallbackFeatures),
        highlight: false, // Will be determined dynamically based on billing cycle toggle
        plan_name: planName,
        monthlyPlanId: monthlyPlan?.id,
        annualPlanId: annualPlan?.id,
        monthlyIsMostPopular: monthlyPlan?.is_most_popular || false,
        annualIsMostPopular: annualPlan?.is_most_popular || false,
      });
    });

    return transformed;
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getPlans();
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          const monthlyPlans = response.data.monthly_plans || [];
          const annualPlans = response.data.annual_plans || [];
          const transformed = transformPlans(monthlyPlans, annualPlans);
          setPlans(transformed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plans');
        // Keep empty array on error - component will handle gracefully
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getPrice = (plan: TransformedPlan) => {
    if (plan.monthlyPrice === 0 && plan.annualPrice === 0) return "₹0";
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return `₹${price.toFixed(0)}`;
  };

  const getSavings = (plan: TransformedPlan) => {
    if (plan.monthlyPrice === 0 || plan.annualPrice === 0) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.annualPrice;
    return savings > 0 ? savings : null;
  };

  const handlePlanClick = (plan: TransformedPlan) => {
    // Navigate to customer dashboard plans page
    router.push('/customer-dashboard?view=plans');
  };

  if (isLoading) {
    return (
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error && plans.length === 0) {
    return (
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load plans. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return null; // Don't show pricing section if no plans
  }

  // Calculate total savings for annual billing
  const totalSavings = plans.reduce((sum, plan) => {
    const savings = getSavings(plan);
    return sum + (savings || 0);
  }, 0);
  const totalMonthlyCost = plans.reduce((sum, plan) => sum + (plan.monthlyPrice * 12), 0);
  const avgSavingsPercent = totalMonthlyCost > 0 && totalSavings > 0
    ? Math.round((totalSavings / totalMonthlyCost) * 100)
    : 0;

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-foreground/70 text-lg mt-4">Flexible subscription plans for individuals and businesses. Access premium designs, unlimited downloads, and exclusive features.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-foreground/50'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-16 h-8 rounded-full bg-primary/20 border border-primary/30 transition-colors hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
          >
            <motion.div
              className="absolute top-1 w-6 h-6 rounded-full bg-primary shadow-lg"
              animate={{ left: isAnnual ? 'calc(100% - 28px)' : '4px' }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-foreground/50'}`}>
            Annually
          </span>
          {isAnnual && avgSavingsPercent > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-2 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold"
            >
              Save up to {avgSavingsPercent}%
            </motion.span>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans
            .filter(plan => {
              // Only show plans that have a price > 0 for the current billing cycle
              const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              return currentPrice > 0;
            })
            .map((plan, index) => {
            const savings = getSavings(plan);
            // Get current plan details based on billing cycle
            const currentTag = isAnnual ? plan.annualTag : plan.monthlyTag;
            const currentBullets = isAnnual ? plan.annualBullets : plan.monthlyBullets;
            // Determine if this plan should be highlighted based on current billing cycle
            const isHighlighted = isAnnual ? plan.annualIsMostPopular : plan.monthlyIsMostPopular;
            
            const cardContent = (
              <div className={`relative rounded-3xl p-8 h-full flex flex-col ${
                isHighlighted 
                  ? 'bg-card border border-border' 
                  : 'bg-card border border-border'
              }`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <motion.p 
                    key={isAnnual ? 'annual-tag' : 'monthly-tag'}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-foreground/60 mb-6"
                  >
                    {currentTag}
                  </motion.p>
                  <div className="flex items-baseline justify-center gap-1">
                    <motion.span 
                      key={isAnnual ? 'annual' : 'monthly'}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                    >
                      {getPrice(plan)}
                    </motion.span>
                    <span className="text-foreground/60 text-sm">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && savings && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-400 text-sm mt-2"
                    >
                      Save ₹{savings.toFixed(0)}/year
                    </motion.p>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {currentBullets.map((bullet, i) => (
                    <motion.li
                      key={`${isAnnual ? 'annual' : 'monthly'}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        isHighlighted ? 'bg-primary/20' : 'bg-primary/10'
                      }`}>
                        <Check className={`w-3 h-3 ${isHighlighted ? 'text-primary' : 'text-primary/80'}`} />
                      </div>
                      <span className="text-sm text-foreground/80 leading-relaxed">{bullet}</span>
                    </motion.li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full rounded-full py-6 font-semibold text-base transition-all ${
                    isHighlighted 
                      ? 'bg-primary hover:shadow-2xl hover:shadow-primary/30 hover:scale-105' 
                      : 'bg-primary/10 text-foreground hover:bg-primary/20'
                  }`}
                >
                  {isHighlighted ? 'Get Started Now' : 'Choose Plan'}
                </Button>
              </div>
            );

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative overflow-visible"
              >
                {isHighlighted ? (
                  <div className="relative">
                    {isHighlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                          <Zap className="w-3.5 h-3.5" />
                          Most Popular
                        </div>
                      </div>
                    )}
                    <ElectricBorder 
                      color="#7df9ff" 
                      speed={1} 
                      chaos={0.35} 
                      thickness={2} 
                      className="overflow-visible"
                      style={{ borderRadius: 24 }}
                    >
                      {cardContent}
                    </ElectricBorder>
                  </div>
                ) : (
                  cardContent
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 text-sm text-foreground/60"
        >
          Secure payments via Razorpay • Instant access after purchase • Cancel anytime • 24/7 customer support
        </motion.p>
      </div>
    </section>
  );
}
