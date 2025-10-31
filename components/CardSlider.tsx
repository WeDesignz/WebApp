"use client";

import { useEffect, useRef, useState } from "react";

interface Item { title: string; desc?: string; image?: string; ctaText?: string }
export default function CardSlider({ title, items }: { title: string; items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number;
    const step = () => {
      if (!paused && !isDragging && el) {
        el.scrollLeft += 1.2;
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
    ref.current.scrollLeft = scrollLeftRef.current - walk;
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

  const duplicatedItems = [...items, ...items];

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


