"use client";

import { useEffect, useRef } from "react";
import { Wand2, Bolt, Globe2, ShieldCheck } from "lucide-react";

type Feature = { title: string; desc: string; icon: React.ReactNode; tint: string };

const features: Feature[] = [
  { title: "AI Design Tools", desc: "Powerful AI-driven assistance to accelerate your creative workflow.", icon: <Wand2 className="w-5 h-5" />, tint: "262 83% 58%" },
  { title: "Instant Collaboration", desc: "Real-time collaboration tools that keep your team in sync.", icon: <Bolt className="w-5 h-5" />, tint: "199 89% 55%" },
  { title: "Global Marketplace", desc: "Connect with clients and designers from around the world.", icon: <Globe2 className="w-5 h-5" />, tint: "173 58% 59%" },
  { title: "Quality Assurance", desc: "Rigorous quality checks ensure only the best designs make it through.", icon: <ShieldCheck className="w-5 h-5" />, tint: "38 92% 55%" },
];

export default function SpotlightFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) {
        el.style.setProperty('--sf-intensity', '0');
        return;
      }
      el.style.setProperty('--sf-x', `${e.clientX - r.left}px`);
      el.style.setProperty('--sf-y', `${e.clientY - r.top}px`);
      el.style.setProperty('--sf-intensity', '1');
    };
    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, []);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Platform Features</h2>
          <p className="text-foreground/70 mt-3">Everything you need to create exceptional designs and build your career.</p>
        </div>
        <div ref={containerRef} className="sf-container relative rounded-3xl p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="relative rounded-2xl border border-border bg-card/70 backdrop-blur hover-elevate p-6 overflow-hidden group">
                <div className="absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(300px circle at var(--sf-x) var(--sf-y), hsl(${f.tint} / 0.18), transparent 70%)` }} />
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl" style={{ backgroundColor: `hsl(${f.tint} / 0.15)`, color: `hsl(${f.tint})` }}>
                  {f.icon}
                </div>
                <div className="relative mt-4 text-lg font-semibold">{f.title}</div>
                <div className="relative mt-2 text-sm text-foreground/70 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



