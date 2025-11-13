"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const logos = ["Figma", "Adobe", "Dribbble", "Behance", "Sketch", "InVision", "Canva", "Framer"];

export default function ClientsStats() {
  const [counts, setCounts] = useState({ clients: 0, designers: 0, assets: 0 });
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const targets = { clients: 1200, designers: 350, assets: 5400 };
    const duration = 2400; // Perfectly balanced duration
    
    // Professional easing curve for counting animations
    // This curve starts smoothly and decelerates naturally
    const perfectEase = (t: number): number => {
      // Clamp to [0, 1]
      const clamped = Math.max(0, Math.min(1, t));
      
      // Custom curve: smooth start, natural deceleration
      // Combination of ease-out-quart and ease-out-expo for perfection
      if (clamped >= 1) return 1;
      
      // Primary: ease-out-quart (smooth and polished)
      const quart = 1 - Math.pow(1 - clamped, 4);
      
      // Secondary: ease-out-expo (for the final smooth deceleration)
      const expo = clamped === 1 ? 1 : 1 - Math.pow(2, -8 * clamped);
      
      // Blend: 70% quart (smooth), 30% expo (natural finish)
      return quart * 0.7 + expo * 0.3;
    };
    
    let animationFrameId: number;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Apply the perfect easing
      const easedProgress = perfectEase(rawProgress);
      
      // Calculate smoothly interpolated values
      const newCounts = {
        clients: Math.round(targets.clients * easedProgress),
        designers: Math.round(targets.designers * easedProgress),
        assets: Math.round(targets.assets * easedProgress),
      };
      
      setCounts(newCounts);
      
      // Continue until completion
      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Final safeguard: ensure exact target values
        setCounts({
          clients: targets.clients,
          designers: targets.designers,
          assets: targets.assets,
        });
      }
    };
    
    // Initialize and start animation
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    let raf: number;
    
    // Calculate the width of one set of logos (8 logos = 1 set)
    const calculateSingleSetWidth = () => {
      // Each logo has min-width 180px + gap of 32px (gap-8 = 2rem = 32px)
      // 8 logos per set
      const logoCount = logos.length; // 8
      const logoWidth = 180; // min-w-[180px]
      const gap = 32; // gap-8 = 2rem
      return logoCount * logoWidth + (logoCount - 1) * gap;
    };
    
    const singleSetWidth = calculateSingleSetWidth();
    
    const step = () => {
      if (!paused && !isDragging && el) {
        el.scrollLeft += 0.6; // Smooth scrolling speed
        
        // Seamlessly loop when we've scrolled past one complete set
        // Since we have 4 sets, we can loop back when past the first set
        if (el.scrollLeft >= singleSetWidth) {
          // Temporarily disable smooth scroll for instant reset
          const wasSmooth = el.style.scrollBehavior;
          el.style.scrollBehavior = 'auto';
          // Instantly reset to the beginning without visual jump
          el.scrollLeft = el.scrollLeft - singleSetWidth;
          // Restore smooth scrolling after a frame
          requestAnimationFrame(() => {
            if (el) el.style.scrollBehavior = wasSmooth || 'smooth';
          });
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
    let newScrollLeft = scrollLeftRef.current - walk;
    
    // Calculate single set width for seamless looping during drag
    const logoCount = logos.length;
    const logoWidth = 180;
    const gap = 32;
    const singleSetWidth = logoCount * logoWidth + (logoCount - 1) * gap;
    
    // Handle seamless looping when dragging past boundaries
    if (newScrollLeft < 0) {
      newScrollLeft = singleSetWidth * 2 + newScrollLeft; // Loop to end of second set
    } else if (newScrollLeft >= singleSetWidth * 2) {
      newScrollLeft = newScrollLeft - singleSetWidth * 2; // Loop back to beginning
    }
    
    sliderRef.current.scrollLeft = newScrollLeft;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleMouseLeaveSlider = () => {
    setIsDragging(false);
    setPaused(false);
  };

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
            {/* Duplicate enough times for seamless infinite loop */}
            {[...logos, ...logos, ...logos, ...logos].map((l, i) => (
              <div
                key={i}
                className="min-w-[180px] text-center text-base font-semibold rounded-xl border border-border py-6 px-8 bg-card/60 backdrop-blur hover-elevate transition-all flex-shrink-0"
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



