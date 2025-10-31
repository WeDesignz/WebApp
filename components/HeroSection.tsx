"use client";

import { Search, Images, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const chips = ["Logo Design", "UI/UX", "Branding", "3D Art"];
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center px-6 md:px-8 pt-28">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
          <div className="text-sm text-foreground/80">Connect with talented designers and clients from around the globe</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          onMouseMove={(e) => {
            const el = e.currentTarget as HTMLDivElement; const r = el.getBoundingClientRect(); el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`); el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
          }}
          className="group rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.25)] p-2 md:p-3 relative overflow-hidden">
          <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%), hsl(var(--primary)/.15), transparent 40%)'}} />
          <div className="flex items-center gap-2 relative">
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-muted/60">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search designs, categories, designers..."
              className="flex-1 bg-transparent outline-none text-base md:text-lg px-3 py-4 transition-transform duration-300 focus:scale-[1.01]"
            />
            <div className="hidden md:flex items-center gap-2 mr-2">
              <button className="p-2 rounded-full border border-border hover:bg-muted/50" aria-label="Generate with AI">
                <Sparkles className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full border border-border hover:bg-muted/50" aria-label="Upload image">
                <Images className="w-4 h-4" />
              </button>
            </div>
            <button className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-primary/30 transition-shadow">
              Search
            </button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-wrap gap-3 justify-center mt-6">
          {chips.map(c => (
            <button key={c} className="px-4 py-1.5 rounded-full text-xs border border-border bg-card hover-elevate">
              {c}
            </button>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }} className="text-center mt-10 text-xs tracking-widest text-muted-foreground">TRUSTED BY INDUSTRY LEADERS</motion.div>
      </div>
    </section>
  );
}


