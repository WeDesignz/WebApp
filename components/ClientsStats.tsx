"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const defaultLogos = ["Figma", "Adobe", "Dribbble", "Behance", "Sketch", "InVision", "Canva", "Framer"];

export default function ClientsStats() {
  const [counts, setCounts] = useState({ clients: 0, designers: 0, assets: 0 });
  const [targetCounts, setTargetCounts] = useState({ clients: 0, designers: 0, assets: 0 });
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Fetch landing page data from API
  useEffect(() => {
    const fetchLandingPageData = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const response = await fetch(`${apiBaseUrl}/api/coreadmin/landing-page-data/`);
        const data = await response.json();
        
        // Set target values for animation
        const fetchedCounts = {
          clients: data.stats?.totalClients || 0,
          designers: data.stats?.totalDesigners || 0,
          assets: data.stats?.totalDesignAssets || 0,
        };
        
        // Use fallback values if API returns 0 or no data
        const finalTargets = {
          clients: fetchedCounts.clients || 1200,
          designers: fetchedCounts.designers || 350,
          assets: fetchedCounts.assets || 5400,
        };
        
        setTargetCounts(finalTargets);
        
        if (data.clientNames && Array.isArray(data.clientNames) && data.clientNames.length > 0) {
          setClientNames(data.clientNames);
        } else {
          // Fallback to default logos if no client names
          setClientNames(defaultLogos);
        }
      } catch (error) {
        console.error('Error fetching landing page data:', error);
        // Fallback to default values
        setTargetCounts({ clients: 1200, designers: 350, assets: 5400 });
        setClientNames(defaultLogos);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandingPageData();
  }, []);

  useEffect(() => {
    if (isLoading || (targetCounts.clients === 0 && targetCounts.designers === 0 && targetCounts.assets === 0)) {
      return; // Don't animate until data is loaded or if targets are 0
    }
    
    const targets = targetCounts;
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
  }, [isLoading, targetCounts.clients, targetCounts.designers, targetCounts.assets]);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el || clientNames.length === 0) return;
    let raf: number;
    
    // Calculate the width of one set of logos
    const calculateSingleSetWidth = () => {
      // Each logo has min-width 180px + gap of 32px (gap-8 = 2rem = 32px)
      const logoCount = clientNames.length;
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
  }, [paused, isDragging, clientNames]);

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
    const logoCount = clientNames.length;
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
            {clientNames.length > 0 && [...clientNames, ...clientNames, ...clientNames, ...clientNames].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="min-w-[180px] text-center text-base font-semibold rounded-xl border border-border py-6 px-8 bg-card/60 backdrop-blur hover-elevate transition-all flex-shrink-0"
              >
                {name}
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



