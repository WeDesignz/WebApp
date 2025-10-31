"use client";

import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function JoinAsFreelancerCTA() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur text-xs mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            Join the Creative Revolution
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient">Transform</span> Your
            <br /> Design Career?
          </h2>
          
          <p className="text-foreground/80 text-lg md:text-xl mt-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of designers already using WeDesign to build their portfolios, connect with clients, and create amazing work. Your creative
            journey starts here.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="px-10 py-7 rounded-full text-lg font-semibold tracking-wide shadow-2xl shadow-primary/30 bg-gradient-to-r from-primary to-purple-600 hover:shadow-primary/50 transition-all">
                Join as Designer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" className="px-10 py-7 rounded-full text-lg font-semibold tracking-wide border-2">
                Browse Designs
              </Button>
            </motion.div>
          </div>

          <div className="text-sm text-foreground/60 mt-8">
            No credit card required • Free to start • Cancel anytime
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
        >
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 text-center hover-elevate">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 text-primary mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Tools</h3>
            <p className="text-sm text-foreground/70">Leverage cutting-edge AI to accelerate your creative workflow</p>
          </div>
          
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 text-center hover-elevate">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/15 text-purple-500 mb-4">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Grow Your Career</h3>
            <p className="text-sm text-foreground/70">Access premium clients and expand your professional network</p>
          </div>
          
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 text-center hover-elevate">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 text-primary mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Global Community</h3>
            <p className="text-sm text-foreground/70">Connect with 350+ designers worldwide</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



