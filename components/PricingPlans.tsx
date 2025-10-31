"use client";

import ElectricBorder from "@/components/ElectricBorder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Free", price: "$0", tag: "Perfect for getting started", bullets: ["5 design posts per month", "Basic profile", "Community support", "Limited AI tools"] },
  { name: "Pro", price: "$29", tag: "For professional designers", bullets: ["Unlimited design posts", "Advanced AI tools", "Priority support", "Custom portfolio", "Analytics dashboard", "Early access to features"], recommended: true },
  { name: "Agency", price: "$99", tag: "For teams and agencies", bullets: ["Everything in Pro", "Team collaboration", "White-label options", "Custom integrations", "Dedicated account manager", "Advanced analytics"] },
];

export default function PricingPlans() {
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Plans</h2>
          <p className="text-foreground/70 mt-3">Transparent pricing for every team size.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((p, i) => {
            const content = (
              <Card className={`rounded-2xl h-full flex flex-col ${p.recommended ? 'relative' : ''}`}>
                <CardContent className="p-6 flex flex-col h-full">
                  {p.recommended && (
                    <div className="flex justify-center mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">Recommended</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between mb-6">
                    <div>
                      <div className="text-xl font-semibold">{p.name}</div>
                      {p.tag && <div className="text-xs text-foreground/60 mt-1">{p.tag}</div>}
                    </div>
                    <div className="text-3xl font-bold">{p.price}<span className="text-sm font-normal text-foreground/70">/month</span></div>
                  </div>
                  <ul className="flex-1 space-y-2.5 text-sm text-foreground/80">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6 rounded-full">Get Started</Button>
                </CardContent>
              </Card>
            );

            return (
              <div key={p.name} className="relative flex">
                {p.recommended ? (
                  <ElectricBorder color="#7df9ff" speed={1} chaos={0.15} thickness={2} style={{ borderRadius: 16 }}>
                    {content}
                  </ElectricBorder>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


