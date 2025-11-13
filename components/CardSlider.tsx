"use client";

import { useEffect, useRef, useState } from "react";

interface Item { title: string; desc?: string; image?: string; ctaText?: string }
export default function CardSlider({ title, items }: { title: string; items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const singleSetWidthRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    
    // Calculate the width of one set of items for seamless looping
    // Use actual DOM measurements for accuracy
    const calculateSingleSetWidth = () => {
      const itemCount = items.length;
      // Get the actual width of the first card element
      const firstChild = el.firstElementChild as HTMLElement;
      if (firstChild) {
        const cardWidth = firstChild.offsetWidth;
        // Get computed gap (gap-5 = 1.25rem = 20px typically)
        const gap = 20; // gap-5 = 1.25rem
        return itemCount * cardWidth + (itemCount - 1) * gap;
      }
      // Fallback calculation
      const cardWidth = typeof window !== 'undefined' && window.innerWidth >= 768 ? 360 : 300;
      const gap = 20;
      return itemCount * cardWidth + (itemCount - 1) * gap;
    };
    
    // Initialize and update the ref for width calculation
    singleSetWidthRef.current = calculateSingleSetWidth();
    
    const handleResize = () => {
      singleSetWidthRef.current = calculateSingleSetWidth();
    };
    window.addEventListener('resize', handleResize);
    
    const step = () => {
      if (!paused && !isDragging && el) {
        el.scrollLeft += 0.8; // Smooth scrolling speed
        
        // Seamlessly loop when we've scrolled past one complete set
        if (el.scrollLeft >= singleSetWidthRef.current) {
          // Temporarily disable smooth scroll for instant reset
          const wasSmooth = el.style.scrollBehavior;
          el.style.scrollBehavior = 'auto';
          // Instantly reset to the beginning without visual jump
          el.scrollLeft = el.scrollLeft - singleSetWidthRef.current;
          // Restore smooth scrolling after a frame
          requestAnimationFrame(() => {
            if (el) el.style.scrollBehavior = wasSmooth || 'smooth';
          });
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [paused, isDragging, items.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX - ref.current.offsetLeft;
    scrollLeftRef.current = ref.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    let newScrollLeft = scrollLeftRef.current - walk;
    
    // Calculate single set width for seamless looping during drag
    const itemCount = items.length;
    const cardWidth = typeof window !== 'undefined' && window.innerWidth >= 768 ? 360 : 300;
    const gap = 20;
    const singleSetWidth = itemCount * cardWidth + (itemCount - 1) * gap;
    
    // Handle seamless looping when dragging past boundaries
    if (newScrollLeft < 0) {
      newScrollLeft = singleSetWidth * 2 + newScrollLeft; // Loop to end of second set
    } else if (newScrollLeft >= singleSetWidth * 2) {
      newScrollLeft = newScrollLeft - singleSetWidth * 2; // Loop back to beginning
    }
    
    ref.current.scrollLeft = newScrollLeft;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleMouseEnter = () => {
    setPaused(true);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setPaused(false);
  };

  // Duplicate items multiple times for seamless infinite loop
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h3>
          <div className="text-xs text-muted-foreground">Hover to pause • Drag to explore</div>
        </div>
        <div
          ref={ref}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex gap-5 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing pb-2"
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {duplicatedItems.map((it, idx) => (
            <div key={`${it.title}-${idx}`} className="min-w-[300px] md:min-w-[360px]">
              <div className="relative h-[220px] md:h-[260px] rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-transform">
                {it.image && (
                  <img src={it.image} alt={it.title} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-background/70 via-background/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-5">
                  <div className="text-lg font-semibold">{it.title}</div>
                  {it.desc && <div className="text-sm text-foreground/80 mt-1 max-w-[90%]">{it.desc}</div>}
                  <div className="text-xs text-link mt-3">{it.ctaText ?? 'Explore →'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


