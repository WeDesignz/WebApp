"use client";

import ElectricBorder from "@/components/ElectricBorder";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  { 
    name: "Free", 
    price: "$0", 
    tag: "Perfect for getting started", 
    bullets: ["5 design posts per month", "Basic profile", "Community support", "Limited AI tools"],
    highlight: false
  },
  { 
    name: "Pro", 
    price: "$29", 
    tag: "For professional designers", 
    bullets: ["Unlimited design posts", "Advanced AI tools", "Priority support", "Custom portfolio", "Analytics dashboard", "Early access to features"],
    highlight: true
  },
  { 
    name: "Agency", 
    price: "$99", 
    tag: "For teams and agencies", 
    bullets: ["Everything in Pro", "Team collaboration", "White-label options", "Custom integrations", "Dedicated account manager", "Advanced analytics"],
    highlight: false
  },
];

export default function PricingPlans() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-foreground/70 text-lg mt-4">Transparent pricing for every team size. No hidden fees.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
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
                    <span className="text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-foreground/60 text-sm">/month</span>
                  </div>
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
                  <ElectricBorder color="#a78bfa" speed={1.5} chaos={1.0} thickness={3} style={{ borderRadius: 24 }}>
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


