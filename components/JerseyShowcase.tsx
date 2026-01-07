"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Rotate3D, ZoomIn, MousePointer2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const jerseyModels = [
  {
    name: "Classic Sports Jersey",
    image: "/generated_images/3D_1.jpeg",
    description: "Premium polyester blend with moisture-wicking technology",
    color: "Blue & White"
  },
  {
    name: "Modern Football Kit",
    image: "/generated_images/3D_2.jpeg",
    description: "Lightweight fabric designed for maximum performance",
    color: "Red & Black"
  },
  {
    name: "Retro Basketball Jersey",
    image: "/generated_images/3D_3.jpeg",
    description: "Classic mesh design with authentic team branding",
    color: "Gold & Purple"
  }
];

function Jersey3DCard({ jersey, isActive }: { jersey: typeof jerseyModels[0]; isActive: boolean }) {
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
            src={jersey.image}
            alt={jersey.name}
            className="w-full h-full object-contain p-4"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(50px)",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentJersey = jerseyModels[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? jerseyModels.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === jerseyModels.length - 1 ? 0 : prev + 1));
  };

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
            Experience Designs in 3D
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Interact with jersey designs from every angle. Move your mouse to see the 3D effect in action.
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
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-8">
              <div className="aspect-square flex items-center justify-center">
                <Jersey3DCard 
                  key={currentIndex}
                  jersey={currentJersey} 
                  isActive={true} 
                />
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  size="icon"
                  className="rounded-full pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleNext}
                  variant="outline"
                  size="icon"
                  className="rounded-full pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs font-medium">
                {currentIndex + 1} / {jerseyModels.length}
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
              <motion.h3 
                key={currentJersey.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold mb-3"
              >
                {currentJersey.name}
              </motion.h3>
              <motion.p 
                key={currentJersey.description}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-foreground/70 mb-2"
              >
                {currentJersey.description}
              </motion.p>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {currentJersey.color}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h4 className="font-semibold text-lg mb-4">Interactive Controls</h4>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Rotate3D className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">3D Tilt Effect</p>
                  <p className="text-sm text-foreground/60">Move your mouse over the jersey to see it tilt in 3D</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ZoomIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Dynamic Shadows</p>
                  <p className="text-sm text-foreground/60">Watch the shadows move realistically as you interact</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MousePointer2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Parallax Depth</p>
                  <p className="text-sm text-foreground/60">Experience depth with layered parallax movement</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Browse Designs</h4>
              <div className="grid grid-cols-3 gap-3">
                {jerseyModels.map((jersey, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                      index === currentIndex
                        ? 'border-primary bg-primary/5 scale-105'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="aspect-square p-2">
                      <img 
                        src={jersey.image} 
                        alt={jersey.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-2 pt-0">
                      <p className="text-xs font-medium truncate">{jersey.name}</p>
                      <p className="text-[10px] text-foreground/60 truncate">{jersey.color}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full rounded-full py-6 bg-primary hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all font-semibold text-base"
              onClick={() => {
                // Always take users to the customer dashboard to browse designs
                window.location.href = '/customer-dashboard';
              }}
            >
              Explore Full Collection →
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
