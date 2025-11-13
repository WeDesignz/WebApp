"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Calendar,
  TrendingUp,
  Star,
  Zap,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Plan {
  id: string;
  name: string;
  price: number;
  icon: any;
  features: string[];
  color: string;
  popular?: boolean;
  savings?: string;
}

const plans: { monthly: Plan[]; annual: Plan[] } = {
  monthly: [
    {
      id: "starter-monthly",
      name: "Starter",
      price: 9.99,
      icon: Star,
      features: [
        "10 designs per month",
        "Basic templates",
        "Standard support",
        "1 GB storage",
        "Email support",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "pro-monthly",
      name: "Pro",
      price: 29.99,
      icon: Zap,
      features: [
        "50 designs per month",
        "Premium templates",
        "Priority support",
        "10 GB storage",
        "Chat & email support",
        "Custom branding",
      ],
      color: "from-purple-500 to-pink-500",
      popular: true,
    },
    {
      id: "enterprise-monthly",
      name: "Enterprise",
      price: 99.99,
      icon: Crown,
      features: [
        "Unlimited designs",
        "All templates",
        "24/7 dedicated support",
        "Unlimited storage",
        "Phone, chat & email support",
        "Custom branding",
        "Team collaboration",
        "API access",
      ],
      color: "from-orange-500 to-red-500",
    },
  ],
  annual: [
    {
      id: "starter-annual",
      name: "Starter",
      price: 99.99,
      icon: Star,
      features: [
        "10 designs per month",
        "Basic templates",
        "Standard support",
        "1 GB storage",
        "Email support",
      ],
      color: "from-blue-500 to-cyan-500",
      savings: "Save $20",
    },
    {
      id: "pro-annual",
      name: "Pro",
      price: 299.99,
      icon: Zap,
      features: [
        "50 designs per month",
        "Premium templates",
        "Priority support",
        "10 GB storage",
        "Chat & email support",
        "Custom branding",
      ],
      color: "from-purple-500 to-pink-500",
      popular: true,
      savings: "Save $60",
    },
    {
      id: "enterprise-annual",
      name: "Enterprise",
      price: 999.99,
      icon: Crown,
      features: [
        "Unlimited designs",
        "All templates",
        "24/7 dedicated support",
        "Unlimited storage",
        "Phone, chat & email support",
        "Custom branding",
        "Team collaboration",
        "API access",
      ],
      color: "from-orange-500 to-red-500",
      savings: "Save $200",
    },
  ],
};

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [hasSubscription, setHasSubscription] = useState(true);

  const currentPlans = plans[billingCycle];

  const mockSubscription = {
    plan: "Pro",
    status: "active",
    billingCycle: "monthly",
    designsUsed: 32,
    designsLimit: 50,
    nextBillingDate: "2025-12-05",
    cardLast4: "4242",
    cardBrand: "Visa",
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Plans & Subscriptions
          </h1>
          <p className="text-muted-foreground">
            Choose the perfect plan for your design needs
          </p>
        </div>

        {hasSubscription && (
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
                        {mockSubscription.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {mockSubscription.plan} Plan - {mockSubscription.billingCycle}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline">Manage Subscription</Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Usage This Month</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Designs</span>
                      <span className="font-semibold">
                        {mockSubscription.designsUsed} of {mockSubscription.designsLimit}
                      </span>
                    </div>
                    <Progress
                      value={(mockSubscription.designsUsed / mockSubscription.designsLimit) * 100}
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Next Billing Date</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {new Date(mockSubscription.nextBillingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Payment Method</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{mockSubscription.cardBrand}</span>
                      <span className="text-muted-foreground">****</span>
                      <span className="font-semibold">{mockSubscription.cardLast4}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-auto p-0 ml-auto">
                      Update
                    </Button>
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

        <div className="grid md:grid-cols-3 gap-6">
          {currentPlans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden h-full flex flex-col ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-primary">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                      </div>
                      {plan.savings && (
                        <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>

                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? `bg-gradient-to-r ${plan.color} hover:opacity-90`
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => setHasSubscription(true)}
                    >
                      {hasSubscription && mockSubscription.plan === plan.name
                        ? "Current Plan"
                        : "Get Started"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

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
    </div>
  );
}
