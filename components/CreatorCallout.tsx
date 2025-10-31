"use client";

import { Button } from "@/components/ui/button";

export default function CreatorCallout() {
  return (
    <section id="creators" className="py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Join as a Freelancer</h2>
          <p className="text-foreground/70 mt-3">Upload your designs, reach clients, and earn from your creativity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border p-8 bg-card hover-elevate">
            <h3 className="text-xl font-semibold">Upload Your Design</h3>
            <p className="text-sm text-foreground/70 mt-2">Showcase UI kits, illustrations, 3D assets, and more.</p>
            <Button className="mt-6 rounded-full">Upload Design</Button>
          </div>
          <div className="rounded-2xl border border-border p-8 bg-card hover-elevate">
            <h3 className="text-xl font-semibold">Become a Freelancer</h3>
            <p className="text-sm text-foreground/70 mt-2">Offer services, collaborate with teams, and grow your portfolio.</p>
            <Button className="mt-6 rounded-full" variant="secondary">Join as Freelancer</Button>
          </div>
        </div>
      </div>
    </section>
  );
}



