"use client";

import { useEffect, useState } from "react";

export default function ClientsStats() {
  const [counts, setCounts] = useState({ clients: 0, designers: 0, assets: 0 });
  useEffect(() => {
    const targets = { clients: 1200, designers: 350, assets: 5400 };
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setCounts({
        clients: Math.floor(targets.clients * p),
        designers: Math.floor(targets.designers * p),
        assets: Math.floor(targets.assets * p),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const logos = ["Figma", "Adobe", "Dribbble", "Behance", "Sketch"]; // placeholders

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="rounded-2xl border border-border p-6 bg-card">
            <div className="text-3xl font-bold">{counts.clients.toLocaleString()}+</div>
            <div className="text-sm text-foreground/70 mt-1">Happy Clients</div>
          </div>
          <div className="rounded-2xl border border-border p-6 bg-card">
            <div className="text-3xl font-bold">{counts.designers.toLocaleString()}+</div>
            <div className="text-sm text-foreground/70 mt-1">Designers</div>
          </div>
          <div className="rounded-2xl border border-border p-6 bg-card">
            <div className="text-3xl font-bold">{counts.assets.toLocaleString()}+</div>
            <div className="text-sm text-foreground/70 mt-1">Design Assets</div>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 items-center opacity-80">
          {logos.map(l => (
            <div key={l} className="text-center text-sm rounded-xl border border-border py-4 bg-card">{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
}



