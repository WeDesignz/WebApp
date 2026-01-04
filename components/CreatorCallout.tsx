"use client";

import { Button } from "@/components/ui/button";

export default function CreatorCallout() {
  return (
    <section id="creators" className="py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Become a Designer on WeDesignz</h2>
          <p className="text-foreground/70 mt-3">Join our community of talented designers. Upload your designs, reach thousands of customers, and earn from your creativity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border p-8 bg-card hover-elevate">
            <h3 className="text-xl font-semibold">Upload Your Designs</h3>
            <p className="text-sm text-foreground/70 mt-2">Showcase jerseys, vectors, mockups, icons, illustrations, 3D models, and more. Set your own prices and earn from every sale.</p>
            <Button className="mt-6 rounded-full" onClick={() => window.location.href = '/designer-console/upload'}>Upload Design</Button>
          </div>
          <div className="rounded-2xl border border-border p-8 bg-card hover-elevate">
            <h3 className="text-xl font-semibold">Start Your Designer Journey</h3>
            <p className="text-sm text-foreground/70 mt-2">Complete our simple onboarding process, get verified, and start selling. Track your earnings, analytics, and grow your portfolio.</p>
            <Button className="mt-6 rounded-full" variant="secondary" onClick={() => window.location.href = '/designer-onboarding'}>Join as Designer</Button>
          </div>
        </div>
      </div>
    </section>
  );
}



