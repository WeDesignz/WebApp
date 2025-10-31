"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export default function ClientsStats() {
  const [counts, setCounts] = useState({ clients: 0, designers: 0, assets: 0 });
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const targets = { clients: 1200, designers: 350, assets: 5400 };
    const start = performance.now();
    const dur = 2000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      setCounts({
        clients: Math.floor(targets.clients * eased),
        designers: Math.floor(targets.designers * eased),
        assets: Math.floor(targets.assets * eased),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    let raf: number;
    const step = () => {
      if (!paused && !isDragging && el) {
        el.scrollLeft += 0.8;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleMouseLeaveSlider = () => {
    setIsDragging(false);
    setPaused(false);
  };

  const logos = ["Figma", "Adobe", "Dribbble", "Behance", "Sketch", "InVision", "Canva", "Framer"];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-border p-6 bg-card/80 backdrop-blur-sm hover-elevate group"
          >
            <motion.div
              key={counts.clients}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent"
            >
              {counts.clients.toLocaleString()}+
            </motion.div>
            <div className="text-sm text-foreground/70 mt-2 font-medium">Happy Clients</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-border p-6 bg-card/80 backdrop-blur-sm hover-elevate group"
          >
            <motion.div
              key={counts.designers}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent"
            >
              {counts.designers.toLocaleString()}+
            </motion.div>
            <div className="text-sm text-foreground/70 mt-2 font-medium">Designers</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-2xl border border-border p-6 bg-card/80 backdrop-blur-sm hover-elevate group"
          >
            <motion.div
              key={counts.assets}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-purple-500 bg-clip-text text-transparent"
            >
              {counts.assets.toLocaleString()}+
            </motion.div>
            <div className="text-sm text-foreground/70 mt-2 font-medium">Design Assets</div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 relative overflow-hidden"
        >
          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseLeaveSlider}
            onMouseEnter={() => setPaused(true)}
            className="flex gap-8 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
          >
            {[...logos, ...logos, ...logos].map((l, i) => (
              <div
                key={i}
                className="min-w-[180px] text-center text-base font-semibold rounded-xl border border-border py-6 px-8 bg-card/60 backdrop-blur hover-elevate transition-all"
              >
                {l}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-xs text-muted-foreground">
            Hover to pause • Drag to scroll
          </div>
        </motion.div>
      </div>
    </section>
  );
}



