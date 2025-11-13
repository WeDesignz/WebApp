"use client";

import { ArrowRight, Award, Palette, Rocket, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ElectricBorder from "@/components/ElectricBorder";

export default function JoinAsFreelancerCTA() {
  const benefits = [
    { icon: <Star className="w-5 h-5" />, text: "Top 1% Designers" },
    { icon: <Award className="w-5 h-5" />, text: "Premium Clients" },
    { icon: <Rocket className="w-5 h-5" />, text: "Fast Growth" }
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6">
              <Palette className="w-3.5 h-3.5" />
              For Creative Professionals
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Showcase Your Work.
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                Get Discovered.
              </span>
            </h2>

            <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
              Join a thriving community of elite designers. Build your portfolio, connect with premium clients, and take your creative career to the next level.
            </p>

            <div className="flex flex-wrap gap-6 mb-8">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {benefit.icon}
                  </div>
                  <span className="font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button className="px-8 py-6 rounded-full text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all">
                Start Your Journey
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="px-8 py-6 rounded-full text-base font-semibold border-2">
                View Success Stories
              </Button>
            </motion.div>

            <p className="text-xs text-foreground/50 mt-6">
              Join 350+ designers • No credit card required • Free to start
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <ElectricBorder color="#7df9ff" speed={1} chaos={0.2} thickness={2} style={{ borderRadius: 24 }}>
              <div className="relative rounded-3xl bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-xl p-8 md:p-10">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Premium Exposure</h3>
                      <p className="text-sm text-foreground/70">Get featured on our homepage and reach 10,000+ monthly visitors</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-primary flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Verified Badge</h3>
                      <p className="text-sm text-foreground/70">Stand out with our exclusive verification badge for professionals</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Growth Tools</h3>
                      <p className="text-sm text-foreground/70">Analytics, AI tools, and insights to accelerate your creative business</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">Avg. Designer Income</span>
                    <span className="text-2xl font-bold text-primary">$4.2K/mo</span>
                  </div>
                </div>
              </div>
            </ElectricBorder>

            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}



