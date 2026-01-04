"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Rotate3D, ZoomIn, MousePointer2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { preferAvifForDisplay } from "@/lib/utils/transformers";

interface Design {
  id: number;
  name: string;
  image: string;
  description: string;
  category?: string;
  price?: string;
  creator?: string;
}

function Jersey3DCard({ design, isActive }: { design: Design; isActive: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);
  const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], [30, -30]);
  const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], [30, -30]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = (e.clientX - centerX) / rect.width;
    const mouseY = (e.clientY - centerY) / rect.height;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={isActive ? { scale: 1 } : { scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl bg-black/20 blur-2xl"
          style={{
            x: shadowX,
            y: shadowY,
            transformStyle: "preserve-3d",
            transform: "translateZ(-50px)",
          }}
        />
        
        <div 
          className="relative w-full h-full rounded-2xl overflow-hidden bg-card border border-border"
          style={{ transformStyle: "preserve-3d" }}
        >
          
          <motion.img
            src={preferAvifForDisplay(design.image) || design.image}
            alt={design.name}
            className="w-full h-full object-contain p-4"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(50px)",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== design.image && design.image) {
                target.src = design.image;
              }
            }}
          />
          
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
              transformStyle: "preserve-3d",
              transform: "translateZ(60px)",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function JerseyShowcase() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const currentDesign = designs[currentIndex];

  useEffect(() => {
    const fetchTrendingDesigns = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.catalogAPI.getTrending();
        
        if (response.data?.trending_designs && Array.isArray(response.data.trending_designs)) {
          // Get top 3 trending designs
          const topDesigns = response.data.trending_designs.slice(0, 3).map((design: any) => {
            // Get the first image from media array or use image field
            const imageUrl = design.media?.[0] || design.image || null;
            const categoryName = design.category?.name || design.category || 'Design';
            const creatorName = design.created_by?.username || 
                               design.created_by?.first_name || 
                               design.creator || 
                               'WeDesignz';
            
            return {
              id: design.id,
              name: design.title || 'Untitled Design',
              image: imageUrl,
              description: design.description || `${categoryName} design by ${creatorName}`,
              category: categoryName,
              price: design.price ? `₹${parseFloat(design.price.toString()).toFixed(0)}` : undefined,
              creator: creatorName,
            };
          });
          
          setDesigns(topDesigns);
        } else {
          // Fallback to empty array if no data
          setDesigns([]);
        }
      } catch (error) {
        console.error('Error fetching trending designs:', error);
        setDesigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingDesigns();
  }, []);

  const handlePrevious = () => {
    if (designs.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? designs.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (designs.length === 0) return;
    setCurrentIndex((prev) => (prev === designs.length - 1 ? 0 : prev + 1));
  };

  const handleDesignClick = (designId: number) => {
    window.location.href = `/customer-dashboard?design=${designId}`;
  };

  // Don't render if loading or no designs
  if (isLoading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (designs.length === 0) {
    return null; // Don't show section if no designs
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            Explore Premium Design Collections
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Browse our curated collection of high-quality designs including jerseys, vectors, mockups, and 3D models. Each design is carefully crafted by verified designers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-8 cursor-pointer group"
                 onClick={() => currentDesign && handleDesignClick(currentDesign.id)}>
              <div className="aspect-square flex items-center justify-center">
                {currentDesign ? (
                  <Jersey3DCard 
                    key={currentDesign.id}
                    design={currentDesign} 
                    isActive={true} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No design available
                  </div>
                )}
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-full pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-full pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs font-medium">
                {currentIndex + 1} / {designs.length}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            <div>
              {currentDesign && (
                <>
                  <motion.h3 
                    key={currentDesign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold mb-3"
                  >
                    {currentDesign.name}
                  </motion.h3>
                  <motion.p 
                    key={`${currentDesign.id}-desc`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-foreground/70 mb-2"
                  >
                    {currentDesign.description}
                  </motion.p>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {currentDesign.category && (
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {currentDesign.category}
                      </span>
                    )}
                    {currentDesign.price && (
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">
                        {currentDesign.price}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h4 className="font-semibold text-lg mb-4">Design Categories</h4>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Rotate3D className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Jersey Designs</p>
                  <p className="text-sm text-foreground/60">Sports jerseys, team uniforms, and athletic wear designs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ZoomIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Vectors & Graphics</p>
                  <p className="text-sm text-foreground/60">Scalable vector graphics, icons, and illustrations</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MousePointer2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Mockups & 3D Models</p>
                  <p className="text-sm text-foreground/60">Product mockups, 3D models, and presentation templates</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Top Trending Designs</h4>
              <div className="grid grid-cols-3 gap-3">
                {designs.map((design, index) => (
                  <button
                    key={design.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      handleDesignClick(design.id);
                    }}
                    className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                      index === currentIndex
                        ? 'border-primary bg-primary/5 scale-105'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="aspect-square p-2 bg-muted/20">
                      {design.image ? (
                        <img 
                          src={preferAvifForDisplay(design.image) || design.image} 
                          alt={design.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== design.image && design.image) {
                              target.src = design.image;
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
                          🎨
                        </div>
                      )}
                    </div>
                    <div className="p-2 pt-0">
                      <p className="text-xs font-medium truncate">{design.name}</p>
                      {design.category && (
                        <p className="text-[10px] text-foreground/60 truncate">{design.category}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full rounded-full py-6 bg-primary hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all font-semibold text-base"
              onClick={() => window.location.href = '/customer-dashboard'}
            >
              Browse All Designs →
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
