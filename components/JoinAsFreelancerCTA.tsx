"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinAsFreelancerCTA() {
  return (
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs mb-6">
          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          Join the Creative Revolution
        </div>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
          Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-purple-500">Transform</span> Your
          <br /> Design Career?
        </h2>
        <p className="text-foreground/80 text-lg md:text-xl mt-6 max-w-3xl mx-auto">
          Join thousands of designers already using WeDesign to build their portfolios, connect with clients, and create amazing work. Your creative
          journey starts here.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Button className="px-8 py-6 rounded-full text-base font-semibold tracking-wide shadow-lg">
            Join as Designer
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" className="px-8 py-6 rounded-full text-base font-semibold tracking-wide">
            Browse Designs
          </Button>
        </div>

        <div className="text-xs text-foreground/60 mt-8">
          No credit card required • Free to start • Cancel anytime
        </div>
      </div>
    </section>
  );
}



