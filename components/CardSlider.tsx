"use client";

import { useEffect, useRef, useState } from "react";

interface Item { 
  id?: number;
  title: string; 
  creator?: string;
  price?: string;
  category?: string;
  image?: string; 
  ctaText?: string;
}

interface CardSliderProps {
  title: string;
  items: Item[];
  isLoading?: boolean;
}

export default function CardSlider({ title, items, isLoading = false }: CardSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const clickAllowedRef = useRef(true);

  // Use global event listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    let touchMoveRAF: number | null = null;

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

    let lastTouchX = 0;
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!ref.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      
      // Store latest touch position for RAF callback
      lastTouchX = touch.clientX;
      
      // Calculate delta from initial touch position
      const deltaX = lastTouchX - startXRef.current;
      
      dragDistanceRef.current = Math.abs(deltaX);
      if (dragDistanceRef.current > 10) {
        hasDraggedRef.current = true;
        clickAllowedRef.current = false;
        // Only prevent default once we're actually dragging
        e.preventDefault();
      }
      
      // Use requestAnimationFrame for smooth updates
      if (touchMoveRAF === null) {
        touchMoveRAF = requestAnimationFrame(() => {
          if (!ref.current) {
            touchMoveRAF = null;
            return;
          }
          
          // Use the latest stored touch position
          const currentDeltaX = lastTouchX - startXRef.current;
          // Smoother scroll calculation for mobile
          const walk = currentDeltaX * (typeof window !== 'undefined' && window.innerWidth < 768 ? 1.2 : 2);
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
          touchMoveRAF = null;
        });
      }
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
      if (touchMoveRAF !== null) {
        cancelAnimationFrame(touchMoveRAF);
        touchMoveRAF = null;
      }
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
      if (touchMoveRAF !== null) {
        cancelAnimationFrame(touchMoveRAF);
        touchMoveRAF = null;
      }
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

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Duplicate items multiple times for seamless infinite loop
  const duplicatedItems = [...items, ...items, ...items, ...items];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-w-[300px] md:min-w-[360px]">
      <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden border border-border bg-card animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-muted/20 via-muted/10 to-muted/20" />
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
          <div className="h-5 bg-muted/30 rounded w-3/4" />
          <div className="h-4 bg-muted/20 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  // Empty state
  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h3>
          {!isLoading && items.length > 0 && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
              <span>Drag to explore</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex gap-5 overflow-x-auto scrollbar-none pb-2">
            {[...Array(4)].map((_, idx) => (
              <LoadingSkeleton key={idx} />
            ))}
          </div>
        ) : (
        <div
          ref={ref}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          className="flex gap-5 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing pb-2"
          style={{ 
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain'
          }}
        >
          {duplicatedItems.map((it, idx) => (
            <div 
                key={`${it.id || it.title}-${idx}`} 
              className="min-w-[300px] md:min-w-[360px] group"
            >
              <a 
                href="/customer-dashboard"
                className="block h-full cursor-grab active:cursor-grabbing select-none"
                draggable={false}
                onMouseDown={(e) => {
                    e.stopPropagation();
                  handleMouseDown(e);
                }}
                onTouchStart={(e) => {
                    e.stopPropagation();
                  handleTouchStart(e);
                }}
                onDragStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onClick={(e) => {
                  if (!clickAllowedRef.current || hasDraggedRef.current || dragDistanceRef.current > 5) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  e.preventDefault();
                  e.stopPropagation();
                    const searchQuery = it.id 
                      ? `design=${it.id}` 
                      : `search=${encodeURIComponent(it.title)}`;
                    window.location.href = `/customer-dashboard?${searchQuery}`;
                }}
              >
                  <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/30 hover:border-border group-hover:bg-card">
                    {/* Image Container */}
                    <div className="absolute inset-0 overflow-hidden">
                      {it.image ? (
                        <>
                    <img 
                      src={it.image} 
                      alt={it.title} 
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" 
                      draggable={false} 
                            onError={(e) => {
                              // Fallback to placeholder on error
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          {/* Fallback placeholder */}
                          <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30">
                            <div className="text-4xl opacity-20">🎨</div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30">
                          <div className="text-4xl opacity-20">🎨</div>
                        </div>
                      )}
                      
                      {/* Gradient overlay - subtle by default, stronger on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  
                    {/* Content - Always visible with enhanced styling */}
                    <div className="relative h-full flex flex-col justify-between p-5 md:p-6 z-10">
                      {/* Top section - Category badge */}
                      {it.category && (
                        <div className="self-start z-20">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md border border-white/40 text-white shadow-lg group-hover:bg-black/80 group-hover:border-white/60 transition-all duration-300">
                            {it.category}
                          </span>
                        </div>
                      )}
                      
                      {/* Bottom section - Title, Creator, Price, CTA */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-lg md:text-xl font-bold text-white leading-tight line-clamp-2 group-hover:text-white transition-colors duration-300">
                            {it.title}
                          </h4>
                          {it.creator && (
                            <p className="text-sm text-white/80 mt-1.5 font-medium">
                              {it.creator}
                            </p>
                          )}
                        </div>
                        
                        {/* Price and CTA */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          {it.price && (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-white">{it.price}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white group-hover:gap-3 transition-all duration-300">
                            <span>{it.ctaText ?? 'View Design'}</span>
                            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl" />
                  </div>
                  
                </div>
              </a>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}


