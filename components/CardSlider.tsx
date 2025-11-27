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
  const dragDistanceRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const clickAllowedRef = useRef(true);

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

  // Use global event listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      e.preventDefault();
      // Calculate delta from initial mouse position (using clientX - same coordinate system)
      const currentX = e.clientX;
      const deltaX = currentX - startXRef.current;
      
      // Track drag distance
      dragDistanceRef.current = Math.abs(deltaX);
      if (dragDistanceRef.current > 5) {
        hasDraggedRef.current = true;
        clickAllowedRef.current = false;
      }
      
      // Calculate scroll change - drag right scrolls left, drag left scrolls right
      const walk = deltaX * 2;
      let newScrollLeft = scrollLeftRef.current - walk;
      
      // Calculate single set width for seamless looping during drag
      const itemCount = items.length;
      const cardWidth = typeof window !== 'undefined' && window.innerWidth >= 768 ? 360 : 300;
      const gap = 20;
      const singleSetWidth = itemCount * cardWidth + (itemCount - 1) * gap;
      
      // Handle seamless looping when dragging past boundaries
      if (newScrollLeft < 0) {
        newScrollLeft = singleSetWidth * 2 + newScrollLeft;
      } else if (newScrollLeft >= singleSetWidth * 2) {
        newScrollLeft = newScrollLeft - singleSetWidth * 2;
      }
      
      ref.current.scrollLeft = newScrollLeft;
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
        dragDistanceRef.current = 0;
        clickAllowedRef.current = true;
      }, 200);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!ref.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      
      // Calculate delta from initial touch position (using clientX - same coordinate system)
      const currentX = touch.clientX;
      const deltaX = currentX - startXRef.current;
      
      dragDistanceRef.current = Math.abs(deltaX);
      if (dragDistanceRef.current > 5) {
        hasDraggedRef.current = true;
        clickAllowedRef.current = false;
      }
      
      // Calculate scroll change - drag right scrolls left, drag left scrolls right
      const walk = deltaX * 2;
      let newScrollLeft = scrollLeftRef.current - walk;
      
      const itemCount = items.length;
      const cardWidth = typeof window !== 'undefined' && window.innerWidth >= 768 ? 360 : 300;
      const gap = 20;
      const singleSetWidth = itemCount * cardWidth + (itemCount - 1) * gap;
      
      if (newScrollLeft < 0) {
        newScrollLeft = singleSetWidth * 2 + newScrollLeft;
      } else if (newScrollLeft >= singleSetWidth * 2) {
        newScrollLeft = newScrollLeft - singleSetWidth * 2;
      }
      
      ref.current.scrollLeft = newScrollLeft;
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
      setTimeout(() => {
        hasDraggedRef.current = false;
        dragDistanceRef.current = 0;
        clickAllowedRef.current = true;
      }, 200);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, items.length]);

  const handleMouseDown = (e: React.MouseEvent | MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragDistanceRef.current = 0;
    clickAllowedRef.current = true;
    // Store initial mouse X position (clientX - relative to viewport, doesn't change with scroll)
    startXRef.current = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
    scrollLeftRef.current = ref.current.scrollLeft;
  };
  
  const handleTouchStart = (e: React.TouchEvent | TouchEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragDistanceRef.current = 0;
    clickAllowedRef.current = true;
    const touch = 'touches' in e ? e.touches[0] : (e as TouchEvent).touches[0];
    // Store initial touch X position (clientX - relative to viewport)
    startXRef.current = touch.clientX;
    scrollLeftRef.current = ref.current.scrollLeft;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
      dragDistanceRef.current = 0;
      clickAllowedRef.current = true;
    }, 200);
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => {
      hasDraggedRef.current = false;
      dragDistanceRef.current = 0;
      clickAllowedRef.current = true;
    }, 200);
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          className="flex gap-5 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing pb-2"
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {duplicatedItems.map((it, idx) => (
            <div 
              key={`${it.title}-${idx}`} 
              className="min-w-[300px] md:min-w-[360px] group"
            >
              <a 
                href="/customer-dashboard"
                className="block h-full cursor-grab active:cursor-grabbing select-none"
                draggable={false}
                onMouseDown={(e) => {
                  // Trigger drag when mousedown on card - propagate to container
                  e.stopPropagation(); // Stop bubbling to prevent double handling
                  handleMouseDown(e);
                }}
                onTouchStart={(e) => {
                  // Trigger drag when touchstart on card - propagate to container
                  e.stopPropagation(); // Stop bubbling to prevent double handling
                  handleTouchStart(e);
                }}
                onDragStart={(e) => {
                  // Prevent default drag behavior
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onClick={(e) => {
                  // Prevent navigation if user was dragging
                  if (!clickAllowedRef.current || hasDraggedRef.current || dragDistanceRef.current > 5) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  // Allow navigation if it was a click, not a drag
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/customer-dashboard?search=${encodeURIComponent(it.title)}`;
                }}
              >
                <div className="relative h-[220px] md:h-[260px] rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 hover:border-white/20">
                  {it.image && (
                    <img 
                      src={it.image} 
                      alt={it.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      draggable={false} 
                    />
                  )}
                  {/* Enhanced gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300" />
                  
                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-5 z-10">
                    <div className="text-lg font-semibold text-white group-hover:text-white transition-colors duration-300">{it.title}</div>
                    {it.desc && (
                      <div className="text-sm text-white/90 mt-1 max-w-[90%] group-hover:text-white transition-colors duration-300">
                        {it.desc}
                      </div>
                    )}
                    <div className="text-xs text-white mt-3 flex items-center gap-2 group-hover:gap-3 transition-all duration-300 font-medium">
                      <span>{it.ctaText ?? 'Explore'}</span>
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                  
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-transparent" />
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


