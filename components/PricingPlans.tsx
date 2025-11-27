"use client";

import ElectricBorder from "@/components/ElectricBorder";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const plans = [
  { 
    name: "Free", 
    monthlyPrice: 0, 
    annualPrice: 0,
    tag: "Perfect for getting started", 
    bullets: ["5 design posts per month", "Basic profile", "Community support", "Limited AI tools"],
    highlight: false
  },
  { 
    name: "Pro", 
    monthlyPrice: 29, 
    annualPrice: 290,
    tag: "For professional designers", 
    bullets: ["Unlimited design posts", "Advanced AI tools", "Priority support", "Custom portfolio", "Analytics dashboard", "Early access to features"],
    highlight: true
  },
  { 
    name: "Agency", 
    monthlyPrice: 99, 
    annualPrice: 990,
    tag: "For teams and agencies", 
    bullets: ["Everything in Pro", "Team collaboration", "White-label options", "Custom integrations", "Dedicated account manager", "Advanced analytics"],
    highlight: false
  },
];

export default function PricingPlans() {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return "$0";
    return isAnnual ? `$${plan.annualPrice}` : `$${plan.monthlyPrice}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.annualPrice;
    return savings > 0 ? savings : null;
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-foreground/70 text-lg mt-4">Transparent pricing for every team size. No hidden fees.</p>
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
          {isAnnual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-2 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold"
            >
              Save up to 17%
            </motion.span>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const savings = getSavings(plan);
            
            const cardContent = (
              <div className={`relative rounded-3xl p-8 h-full flex flex-col ${
                plan.highlight 
                  ? 'bg-gradient-to-br from-card via-card to-primary/5' 
                  : 'bg-card/60 backdrop-blur-sm border border-border'
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                      <Zap className="w-3.5 h-3.5" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-foreground/60 mb-6">{plan.tag}</p>
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
                      Save ${savings}/year
                    </motion.p>
                  )}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.bullets.map((bullet, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + i * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        plan.highlight ? 'bg-primary/20' : 'bg-primary/10'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? 'text-primary' : 'text-primary/80'}`} />
                      </div>
                      <span className="text-sm text-foreground/80 leading-relaxed">{bullet}</span>
                    </motion.li>
                  ))}
                </ul>

                <Button 
                  className={`w-full rounded-full py-6 font-semibold text-base transition-all ${
                    plan.highlight 
                      ? 'bg-gradient-to-r from-primary to-purple-600 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105' 
                      : 'bg-primary/10 text-foreground hover:bg-primary/20'
                  }`}
                >
                  {plan.highlight ? 'Get Started Now' : 'Choose Plan'}
                </Button>
              </div>
            );

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {plan.highlight ? (
                  <ElectricBorder color="#7df9ff" speed={1} chaos={0.5} thickness={2} style={{ borderRadius: 24 }}>
                    {cardContent}
                  </ElectricBorder>
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
          All plans include 14-day free trial • No credit card required • Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
