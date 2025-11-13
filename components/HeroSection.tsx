"use client";

import { Search, Images, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const chips = ["Logo Design", "UI/UX", "Branding", "3D Art"];
  return (
    <section className="relative h-screen flex items-center justify-center px-6 md:px-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 md:gap-8 lg:gap-10">
        {/* Main Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }} 
          className="text-center space-y-4 md:space-y-6"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
            Discover Creative Designs
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Connect with talented designers and clients from around the globe
          </p>
        </motion.div>

        {/* Enhanced Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          onMouseMove={(e) => {
            const el = e.currentTarget as HTMLDivElement; 
            const r = el.getBoundingClientRect(); 
            el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`); 
            el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
          }}
          className="group relative"
        >
          <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" style={{background: 'radial-gradient(800px circle at var(--mouse-x,50%) var(--mouse-y,50%), hsl(var(--primary)/.25), transparent 50%)'}} />
          <div className="relative rounded-3xl border border-border/50 bg-card/70 backdrop-blur-2xl shadow-2xl p-3 md:p-4 lg:p-5 transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-[0_20px_60px_rgba(0,0,0,.4)]">
            <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%), hsl(var(--primary)/.15), transparent 40%)'}} />
            <div className="flex items-center gap-3 md:gap-4 relative">
              <div className="hidden md:flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-muted/40 group-hover:bg-primary/10 transition-colors">
                <Search className="w-6 h-6 lg:w-7 lg:h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search designs, categories, designers..."
                className="flex-1 bg-transparent outline-none text-base md:text-lg lg:text-xl px-4 py-4 md:py-5 transition-all duration-300 focus:scale-[1.01] placeholder:text-muted-foreground/60"
              />
              <div className="hidden md:flex items-center gap-2 mr-2">
                <button className="p-2.5 lg:p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 hover:scale-110" aria-label="Generate with AI">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
                <button className="p-2.5 lg:p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 hover:scale-110" aria-label="Upload image">
                  <Images className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
              <button className="px-6 md:px-8 py-4 md:py-5 rounded-xl bg-primary text-primary-foreground font-semibold text-base md:text-lg shadow-lg hover:shadow-primary/50 hover:scale-105 transition-all duration-300 active:scale-100">
                Search
              </button>
            </div>
          </div>
        </motion.div>

        {/* Category Chips */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.4 }} 
          className="flex flex-wrap gap-3 md:gap-4 justify-center"
        >
          {chips.map((c, index) => (
            <motion.button 
              key={c} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="px-5 md:px-6 py-2.5 md:py-3 rounded-full text-sm md:text-base border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/50 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-105"
            >
              {c}
            </motion.button>
          ))}
        </motion.div>

        {/* Trust Statement */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.8, delay: 0.7 }} 
          className="text-center"
        >
          <p className="text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground/60 uppercase font-medium">
            TRUSTED BY INDUSTRY LEADERS
          </p>
        </motion.div>
      </div>
    </section>
  );
}


